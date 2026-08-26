using System.IO.Compression;
using Itinero;

namespace CeleoxApi.Services;

public class RoutingService
{
    private const string RouterDbFileName = "cataluna.routerdb";
    private const string RouterDbZipFileName = "routerdb.zip";

    private const string RouterDbDownloadUrl =
        "https://github.com/dbel03/celeox/releases/download/routerdb-v1/routerdb.zip";

    private readonly RouterDb _routerDb;

    private RoutingService(RouterDb routerDb)
    {
        _routerDb = routerDb;
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

        string localPath;
        string zipPath;

        if (environment.IsDevelopment())
        {
            localPath = Path.Combine(
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
            localPath = Path.Combine(
                Path.GetTempPath(),
                RouterDbFileName
            );

            zipPath = Path.Combine(
                Path.GetTempPath(),
                RouterDbZipFileName
            );
        }

        RouterDb routerDb;

        // ============================================================
        // 1. DEVELOPMENT
        // ============================================================

        if (environment.IsDevelopment())
        {
            Console.WriteLine(
                $"Development: cargando RouterDb local: {localPath}"
            );

            if (!File.Exists(localPath))
            {
                throw new FileNotFoundException(
                    "No se encontró el RouterDb local.",
                    localPath
                );
            }

            routerDb = await LoadRouterDbAsync(localPath);
        }

        // ============================================================
        // 2. PRODUCTION
        // ============================================================

        else
        {
            // --------------------------------------------------------
            // 2.1. Comprobar si ya existe en /tmp
            // --------------------------------------------------------

            if (File.Exists(localPath))
            {
                Console.WriteLine(
                    $"Production: RouterDb encontrado localmente: {localPath}"
                );
            }
            else
            {
                // ----------------------------------------------------
                // 2.2. Descargar desde GitHub Release
                // ----------------------------------------------------

                Console.WriteLine(
                    "Production: RouterDb no encontrado localmente."
                );

                Console.WriteLine(
                    "Production: descargando RouterDb desde GitHub Release..."
                );

                await DownloadRouterDbAsync(
                    httpClient,
                    zipPath,
                    localPath
                );
            }

            // --------------------------------------------------------
            // 2.3. Cargar RouterDb
            // --------------------------------------------------------

            routerDb = await LoadRouterDbAsync(localPath);
        }

        // ============================================================
        // 3. RouterDb cargado
        // ============================================================

        var elapsed = DateTime.UtcNow - start;

        Console.WriteLine(
            $"RouterDb cargado en memoria en {elapsed.TotalSeconds:F2}s"
        );

        Console.WriteLine("======================================");

        return new RoutingService(routerDb);
    }

    // ================================================================
    // DESCARGA + DESCOMPRESIÓN
    // ================================================================

    private static async Task DownloadRouterDbAsync(
        HttpClient httpClient,
        string zipPath,
        string routerDbPath)
    {
        // Si quedó un ZIP incompleto de un intento anterior,
        // lo eliminamos.
        if (File.Exists(zipPath))
        {
            File.Delete(zipPath);
        }

        // Si quedó un RouterDb incompleto, también lo eliminamos.
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

        Console.WriteLine(
            $"Production: descarga iniciada. Tamaño: {response.Content.Headers.ContentLength / 1024.0 / 1024.0:F2} MB"
        );

        // ------------------------------------------------------------
        // Descargar directamente a disco.
        // NO usamos MemoryStream.
        // ------------------------------------------------------------

        await using (var networkStream =
            await response.Content.ReadAsStreamAsync())
        await using (var fileStream =
            new FileStream(
                zipPath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 1024 * 1024,
                useAsync: true))
        {
            await networkStream.CopyToAsync(fileStream);
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

        using (var archive =
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
                    FileShare.None,
                    bufferSize: 1024 * 1024,
                    useAsync: true
                );

            await entryStream.CopyToAsync(outputStream);
        }

        Console.WriteLine(
            $"Production: RouterDb descomprimido: {routerDbPath}"
        );

        // ------------------------------------------------------------
        // Borrar ZIP.
        // Solo necesitamos el .routerdb.
        // ------------------------------------------------------------

        File.Delete(zipPath);

        Console.WriteLine(
            "Production: ZIP temporal eliminado."
        );
    }

    // ================================================================
    // CARGA DE ROUTERDB
    // ================================================================

    private static async Task<RouterDb> LoadRouterDbAsync(
        string path)
    {
        Console.WriteLine(
            $"Cargando RouterDb desde: {path}"
        );

        await using var fileStream =
            new FileStream(
                path,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 1024 * 1024,
                useAsync: true
            );

        using var memoryStream =
            new MemoryStream();

        await fileStream.CopyToAsync(
            memoryStream
        );

        memoryStream.Position = 0;

        return RouterDb.Deserialize(
            memoryStream
        );
    }

    // ================================================================
    // ROUTER
    // ================================================================

    public Router CreateRouter()
    {
        return new Router(_routerDb);
    }
}