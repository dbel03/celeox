using System.IO.Compression;
using Itinero;

namespace CeleoxApi.Services;

public class RoutingService : IDisposable
{
    private const string RouterDbFileName = "cataluna.routerdb";
    private const string RouterDbZipFileName = "routerdb.zip";

    private const string RouterDbDownloadUrl =
        "https://github.com/dbel03/celeox/releases/download/routerdb-v1/routerdb.zip";

    private readonly RouterDb _routerDb;

    // IMPORTANTE:
    // RouterDbProfile.NoCache necesita que el Stream permanezca abierto.
    private FileStream? _routerDbStream;

    private RoutingService(
        RouterDb routerDb,
        FileStream? routerDbStream)
    {
        _routerDb = routerDb;
        _routerDbStream = routerDbStream;
    }

    public static async Task<RoutingService> CreateAsync(
        HttpClient httpClient,
        IWebHostEnvironment environment)
    {
        Console.WriteLine("======================================");

        var start = DateTime.UtcNow;

        // ============================================================
        // RUTAS
        // ============================================================

        string routerDbPath;
        string zipPath;

        if (environment.IsDevelopment())
        {
            routerDbPath = Path.Combine(
                environment.ContentRootPath,
                "Data",
                "routing",
                RouterDbFileName
            );

            zipPath = Path.Combine(
                Path.GetTempPath(),
                RouterDbZipFileName
            );
        }
        else
        {
            routerDbPath = Path.Combine(
                Path.GetTempPath(),
                RouterDbFileName
            );

            zipPath = Path.Combine(
                Path.GetTempPath(),
                RouterDbZipFileName
            );
        }

        // ============================================================
        // 1. DEVELOPMENT
        // ============================================================

        if (environment.IsDevelopment())
        {
            Console.WriteLine(
                $"Development: cargando RouterDb local: {routerDbPath}"
            );

            if (!File.Exists(routerDbPath))
            {
                throw new FileNotFoundException(
                    "No se encontró el RouterDb local.",
                    routerDbPath
                );
            }

            // En desarrollo también usamos NoCache.
            // Esto permite probar localmente exactamente el mismo
            // comportamiento que tendremos en Render.
            var fileStream = new FileStream(
                routerDbPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 1024 * 1024,
                useAsync: true
            );

            try
            {
                var routerDb =
                    RouterDb.Deserialize(
                        fileStream,
                        RouterDbProfile.NoCache
                    );

                Console.WriteLine(
                    "Development: RouterDb cargado usando NoCache."
                );

                var elapsed =
                    DateTime.UtcNow - start;

                Console.WriteLine(
                    $"RouterDb cargado en {elapsed.TotalSeconds:F2}s"
                );

                Console.WriteLine("======================================");

                return new RoutingService(
                    routerDb,
                    fileStream
                );
            }
            catch
            {
                await fileStream.DisposeAsync();
                throw;
            }
        }

        // ============================================================
        // 2. PRODUCTION
        // ============================================================

        // ------------------------------------------------------------
        // 2.1. Comprobar si ya existe en /tmp
        // ------------------------------------------------------------

        if (File.Exists(routerDbPath))
        {
            Console.WriteLine(
                $"Production: RouterDb encontrado localmente: {routerDbPath}"
            );
        }
        else
        {
            Console.WriteLine(
                "Production: RouterDb no encontrado localmente."
            );

            Console.WriteLine(
                "Production: descargando RouterDb desde GitHub Release..."
            );

            await DownloadRouterDbAsync(
                httpClient,
                zipPath,
                routerDbPath
            );
        }

        // ============================================================
        // 3. ABRIR FILESTREAM
        // ============================================================

        Console.WriteLine(
            $"Production: cargando RouterDb desde: {routerDbPath}"
        );

        var productionFileStream = new FileStream(
            routerDbPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 1024 * 1024,
            useAsync: true
        );

        try
        {
            // ========================================================
            // IMPORTANTE:
            //
            // NO usamos:
            //
            // MemoryStream
            // FileStream -> MemoryStream -> RouterDb
            //
            // Usamos directamente el FileStream con NoCache.
            //
            // Esto evita copiar los ~140 MB a RAM.
            // ========================================================

            var routerDb =
                RouterDb.Deserialize(
                    productionFileStream,
                    RouterDbProfile.NoCache
                );

            Console.WriteLine(
                "Production: RouterDb cargado usando NoCache."
            );

            var elapsed =
                DateTime.UtcNow - start;

            Console.WriteLine(
                $"RouterDb cargado en {elapsed.TotalSeconds:F2}s"
            );

            Console.WriteLine("======================================");

            return new RoutingService(
                routerDb,
                productionFileStream
            );
        }
        catch
        {
            await productionFileStream.DisposeAsync();
            throw;
        }
    }

    // ================================================================
    // DESCARGAR + DESCOMPRIMIR
    // ================================================================

    private static async Task DownloadRouterDbAsync(
        HttpClient httpClient,
        string zipPath,
        string routerDbPath)
    {
        // ------------------------------------------------------------
        // Limpiar posibles restos de una descarga anterior
        // ------------------------------------------------------------

        if (File.Exists(zipPath))
        {
            File.Delete(zipPath);
        }

        if (File.Exists(routerDbPath))
        {
            File.Delete(routerDbPath);
        }

        // ------------------------------------------------------------
        // Descargar ZIP directamente a disco
        // ------------------------------------------------------------

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
                $"Production: descarga iniciada. Tamaño: {contentLength.Value / 1024.0 / 1024.0:F2} MB"
            );
        }
        else
        {
            Console.WriteLine(
                "Production: descarga iniciada. Tamaño desconocido."
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
            $"Production: ZIP descargado: {zipPath}"
        );

        // ------------------------------------------------------------
        // Descomprimir
        // ------------------------------------------------------------

        Console.WriteLine(
            "Production: descomprimiendo RouterDb..."
        );

        using (
            var archive =
                ZipFile.OpenRead(zipPath))
        {
            var entry =
                archive.GetEntry(RouterDbFileName);

            if (entry == null)
            {
                throw new FileNotFoundException(
                    $"El ZIP no contiene '{RouterDbFileName}'."
                );
            }

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

        // ------------------------------------------------------------
        // El ZIP ya no hace falta
        // ------------------------------------------------------------

        File.Delete(zipPath);

        Console.WriteLine(
            "Production: ZIP temporal eliminado."
        );
    }

    // ================================================================
    // CREAR ROUTER
    // ================================================================

    public Router CreateRouter()
    {
        return new Router(_routerDb);
    }

    // ================================================================
    // LIBERAR FILESTREAM
    // ================================================================

    public void Dispose()
    {
        if (_routerDbStream != null)
        {
            _routerDbStream.Dispose();
            _routerDbStream = null;
        }
    }
}