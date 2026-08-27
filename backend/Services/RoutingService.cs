using System.IO.Compression;
using Itinero;

namespace CeleoxApi.Services;

public class RoutingService : IDisposable
{
    private RouterDb? _routerDb;
    private FileStream? _routerDbStream;

    private readonly ReaderWriterLockSlim _lock = new();

    private const string RouterDbFileName = "cataluna.routerdb";
    private const string RouterDbZipFileName = "routerdb.zip";

    private const string RouterDbDownloadUrl =
        "https://github.com/dbel03/celeox/releases/download/routerdb-v1/routerdb.zip";

    public bool IsReady => _routerDb is not null;

    public Router GetRouter()
    {
        _lock.EnterReadLock();
        try
        {
            if (_routerDb is null)
                throw new InvalidOperationException("RouterDb no está cargado todavía.");

            return new Router(_routerDb);
        }
        finally
        {
            _lock.ExitReadLock();
        }
    }

    public async Task LoadAsync(HttpClient httpClient)
    {
        var routerDbPath = Path.Combine(Path.GetTempPath(), RouterDbFileName);

        if (!File.Exists(routerDbPath))
        {
            Console.WriteLine(
                $"Archivo no existe en TEMP, descargando..."
            );
            var zipPath = Path.Combine(Path.GetTempPath(), RouterDbZipFileName);
            await DownloadRouterDbAsync(httpClient, zipPath, routerDbPath);
        }

        var fileStream = new FileStream(
            routerDbPath, FileMode.Open, FileAccess.Read, FileShare.Read,
            bufferSize: 1024 * 1024, useAsync: true);

        try
        {
            // Carga completa en RAM (rápido, pero consume más memoria).
            var loaded = RouterDb.Deserialize(fileStream);

            //NoCache (lento, pero ligero en memoria).
            // var loaded = RouterDb.Deserialize(fileStream, RouterDbProfile.NoCache);

            _lock.EnterWriteLock();
            try
            {
                _routerDbStream?.Dispose();
                _routerDb = loaded;

                // Con carga en RAM el stream ya no hace falta mantenerlo abierto.
                // Si vuelves a NoCache, descomenta la línea de abajo (necesita el stream vivo).
                fileStream.Dispose();

                // _routerDbStream = fileStream;
            }
            finally { _lock.ExitWriteLock(); }
        }
        catch
        {
            await fileStream.DisposeAsync();
            throw;
        }
    }

    private static async Task DownloadRouterDbAsync(
        HttpClient httpClient,
        string zipPath,
        string routerDbPath)
    {
        if (File.Exists(zipPath))
        {
            File.Delete(zipPath);
        }

        if (File.Exists(routerDbPath))
        {
            File.Delete(routerDbPath);
        }

        using var response =
            await httpClient.GetAsync(
                RouterDbDownloadUrl,
                HttpCompletionOption.ResponseHeadersRead
            );

        response.EnsureSuccessStatusCode();

        var contentLength =
            response.Content.Headers.ContentLength;

        if (contentLength.HasValue)
        {
            Console.WriteLine(
                $"Descarga iniciada. Tamaño: {contentLength.Value / 1024.0 / 1024.0:F2} MB"
            );
        }
        else
        {
            Console.WriteLine(
                "Descarga iniciada. Tamaño desconocido."
            );
        }

        await using (
            var networkStream =
                await response.Content.ReadAsStreamAsync())
        await using (
            var fileStream =
                new FileStream(
                    zipPath,
                    FileMode.Create,
                    FileAccess.Write,
                    FileShare.None,
                    bufferSize: 1024 * 1024,
                    useAsync: true))
        {
            await networkStream.CopyToAsync(
                fileStream
            );
        }

        Console.WriteLine(
            $"ZIP descargado: {zipPath}"
        );

        Console.WriteLine(
            "Production: descomprimiendo RouterDb..."
        );

        using (
            var archive =
                ZipFile.OpenRead(zipPath))
        {
            var entry =
                archive.GetEntry(RouterDbFileName) ?? throw new FileNotFoundException(
                    $"El ZIP no contiene '{RouterDbFileName}'."
                );

            await using var entryStream =
                entry.Open();

            await using var outputStream =
                new FileStream(
                    routerDbPath,
                    FileMode.Create,
                    FileAccess.Write,
                    FileShare.Read,
                    bufferSize: 1024 * 1024,
                    useAsync: true
                );

            await entryStream.CopyToAsync(
                outputStream
            );
        }

        Console.WriteLine(
            $"Production: RouterDb descomprimido: {routerDbPath}"
        );

        File.Delete(zipPath);

        Console.WriteLine(
            "Production: ZIP temporal eliminado."
        );
    }

    public void Dispose()
    {
        Console.WriteLine("RoutingService.Dispose() llamado por el host.");
        _routerDbStream?.Dispose();
        _lock.Dispose();
    }
}