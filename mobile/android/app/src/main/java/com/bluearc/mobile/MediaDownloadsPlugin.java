package com.bluearc.mobile;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.MimeTypeMap;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Locale;

@CapacitorPlugin(
    name = "MediaDownloads",
    permissions = {
        @Permission(
            alias = "storage",
            strings = {
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            }
        )
    }
)
public class MediaDownloadsPlugin extends Plugin {
    private static final String APP_FOLDER = "BlueArc";

    @PluginMethod
    public void saveFile(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }

        persistFile(call);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            persistFile(call);
        } else {
            call.reject("Permiso de almacenamiento denegado");
        }
    }

    private void persistFile(PluginCall call) {
        String fileName = sanitizeFileName(call.getString("fileName"));
        String mimeType = resolveMimeType(call.getString("mimeType"), fileName);
        String base64Data = normalizeBase64(call.getString("data"));
        String fileCategory = resolveCategory(call.getString("category"), mimeType);

        if (fileName == null || fileName.isEmpty()) {
            call.reject("Nombre de archivo inválido");
            return;
        }

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("No se recibieron datos del archivo");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            JSObject result = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? saveWithMediaStore(fileName, mimeType, fileCategory, bytes)
                : saveLegacy(fileName, mimeType, fileCategory, bytes);

            call.resolve(result);
        } catch (Exception error) {
            call.reject("No se pudo guardar el archivo", error);
        }
    }

    private JSObject saveWithMediaStore(String fileName, String mimeType, String category, byte[] bytes) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, getRelativePath(category));
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri collection = getCollectionUri(category);
        Uri itemUri = resolver.insert(collection, values);

        if (itemUri == null) {
            throw new IllegalStateException("No se pudo crear el registro en MediaStore");
        }

        try (OutputStream outputStream = resolver.openOutputStream(itemUri)) {
            if (outputStream == null) {
                throw new IllegalStateException("No se pudo abrir el archivo para escritura");
            }
            outputStream.write(bytes);
            outputStream.flush();
        }

        ContentValues publishValues = new ContentValues();
        publishValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(itemUri, publishValues, null, null);

        JSObject result = new JSObject();
        result.put("uri", itemUri.toString());
        result.put("fileName", fileName);
        result.put("location", getRelativePath(category));
        result.put("category", category);
        return result;
    }

    private JSObject saveLegacy(String fileName, String mimeType, String category, byte[] bytes) throws Exception {
        File baseDirectory = Environment.getExternalStoragePublicDirectory(getLegacyDirectory(category));
        File targetDirectory = new File(baseDirectory, APP_FOLDER);

        if (!targetDirectory.exists() && !targetDirectory.mkdirs()) {
            throw new IllegalStateException("No se pudo crear el directorio destino");
        }

        File outputFile = new File(targetDirectory, fileName);
        try (FileOutputStream outputStream = new FileOutputStream(outputFile)) {
            outputStream.write(bytes);
            outputStream.flush();
        }

        MediaScannerConnection.scanFile(
            getContext(),
            new String[]{outputFile.getAbsolutePath()},
            new String[]{mimeType},
            null
        );

        JSObject result = new JSObject();
        result.put("uri", Uri.fromFile(outputFile).toString());
        result.put("fileName", fileName);
        result.put("location", targetDirectory.getAbsolutePath());
        result.put("category", category);
        return result;
    }

    private Uri getCollectionUri(String category) {
        if ("image".equals(category)) {
            return MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        }

        if ("audio".equals(category)) {
            return MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        }

        return MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
    }

    private String getRelativePath(String category) {
        if ("image".equals(category)) {
            return Environment.DIRECTORY_PICTURES + "/" + APP_FOLDER;
        }

        if ("audio".equals(category)) {
            return Environment.DIRECTORY_MUSIC + "/" + APP_FOLDER;
        }

        return Environment.DIRECTORY_DOWNLOADS + "/" + APP_FOLDER;
    }

    private String getLegacyDirectory(String category) {
        if ("image".equals(category)) {
            return Environment.DIRECTORY_PICTURES;
        }

        if ("audio".equals(category)) {
            return Environment.DIRECTORY_MUSIC;
        }

        return Environment.DIRECTORY_DOWNLOADS;
    }

    private String resolveCategory(String category, String mimeType) {
        if (category != null) {
            String normalized = category.toLowerCase(Locale.ROOT);
            if ("image".equals(normalized) || "audio".equals(normalized) || "document".equals(normalized)) {
                return normalized;
            }
        }

        if (mimeType.startsWith("image/")) {
            return "image";
        }

        if (mimeType.startsWith("audio/")) {
            return "audio";
        }

        return "document";
    }

    private String resolveMimeType(String mimeType, String fileName) {
        if (mimeType != null && !mimeType.isEmpty() && !"application/octet-stream".equalsIgnoreCase(mimeType)) {
            return mimeType;
        }

        String extension = MimeTypeMap.getFileExtensionFromUrl(fileName);
        if (extension != null && !extension.isEmpty()) {
            String detected = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.toLowerCase(Locale.ROOT));
            if (detected != null && !detected.isEmpty()) {
                return detected;
            }
        }

        return "application/octet-stream";
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return null;
        }

        return fileName
            .replaceAll("[\\\\/:*?\"<>|]", "_")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private String normalizeBase64(String data) {
        if (data == null) {
            return null;
        }

        int separator = data.indexOf(',');
        return separator >= 0 ? data.substring(separator + 1) : data;
    }
}
