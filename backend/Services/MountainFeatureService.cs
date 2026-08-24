using CeleoxApi.Data;
using CeleoxApi.Models;
using MongoDB.Driver;

namespace CeleoxApi.Services;

public class MountainFeatureService(
    MongoDbContext context)
{
    private readonly MongoDbContext _context = context;


    /*
     * =========================================================
     * IMPORTAR / UPSERT FEATURES
     * =========================================================
     */

    public async Task UpsertMountainFeaturesAsync(
        IEnumerable<MountainFeature> features)
    {
        var featureList =
            features.ToList();

        if (featureList.Count == 0)
        {
            return;
        }

        var operations =
            featureList.Select(feature =>
                new ReplaceOneModel<MountainFeature>(
                    Builders<MountainFeature>.Filter.Eq(
                        x => x.Id,
                        feature.Id
                    ),
                    feature
                )
                {
                    IsUpsert = true
                }
            );

        await _context.MountainFeatures
            .BulkWriteAsync(operations);
    }


    /*
     * =========================================================
     * OBTENER FEATURES DENTRO DE UN BOUNDING BOX
     * =========================================================
     */

    public async Task<List<MountainFeature>> GetFeaturesInBoundsAsync(
        string type,
        double minLat,
        double maxLat,
        double minLon,
        double maxLon)
    {
        var filter =
            Builders<MountainFeature>.Filter.Eq(
                x => x.Type,
                type
            )
            &
            Builders<MountainFeature>.Filter.Gte(
                x => x.Latitude,
                minLat
            )
            &
            Builders<MountainFeature>.Filter.Lte(
                x => x.Latitude,
                maxLat
            )
            &
            Builders<MountainFeature>.Filter.Gte(
                x => x.Longitude,
                minLon
            )
            &
            Builders<MountainFeature>.Filter.Lte(
                x => x.Longitude,
                maxLon
            );

        return await _context.MountainFeatures
            .Find(filter)
            .ToListAsync();
    }


    /*
     * =========================================================
     * FEATURES CERCANOS A UNA RUTA
     * =========================================================
     */

    public async Task<List<MountainFeature>> GetFeaturesAlongTrackAsync(
        List<RoutePoint> track,
        double radiusMeters = 100)
    {
        if (track == null || track.Count < 2)
        {
            return [];
        }


        /*
         * -----------------------------------------------------
         * 1. Bounding box de la ruta
         * -----------------------------------------------------
         */

        var minLat =
            track.Min(x => x.Latitude);

        var maxLat =
            track.Max(x => x.Latitude);

        var minLon =
            track.Min(x => x.Longitude);

        var maxLon =
            track.Max(x => x.Longitude);


        /*
         * -----------------------------------------------------
         * 2. Ampliar el bounding box
         * -----------------------------------------------------
         */

        var latMargin =
            radiusMeters / 111_000.0;

        var averageLatitude =
            track.Average(x => x.Latitude);

        var longitudeFactor =
            Math.Cos(
                averageLatitude *
                Math.PI /
                180.0
            );

        var lonMargin =
            radiusMeters /
            (111_000.0 * longitudeFactor);

        minLat -= latMargin;
        maxLat += latMargin;

        minLon -= lonMargin;
        maxLon += lonMargin;


        /*
         * -----------------------------------------------------
         * 3. Buscar candidatos en MongoDB
         * -----------------------------------------------------
         */

        var candidates =
            await GetFeaturesInBoundsWithoutTypeAsync(
                minLat,
                maxLat,
                minLon,
                maxLon
            );

        Console.WriteLine("=================================");
        Console.WriteLine($"MIN LAT: {minLat}");
        Console.WriteLine($"MAX LAT: {maxLat}");
        Console.WriteLine($"MIN LON: {minLon}");
        Console.WriteLine($"MAX LON: {maxLon}");
        Console.WriteLine($"CANDIDATOS: {candidates.Count}");
        Console.WriteLine("=================================");

        foreach (var feature in candidates)
        {
            Console.WriteLine(
                $"{feature.Name} -> " +
                $"{feature.Latitude}, {feature.Longitude}"
            );
        }


        /*
         * -----------------------------------------------------
         * 4. Filtrar por distancia real a la ruta
         * -----------------------------------------------------
         */

        var items =
            candidates
                .Select(feature => new
                {
                    Feature = feature,

                    Distance =
                        DistanceToTrackMeters(
                            feature.Latitude,
                            feature.Longitude,
                            track
                        )
                })
                .Where(x =>
                    x.Distance <= radiusMeters
                )
                .ToList();


        foreach (var item in items)
        {
            Console.WriteLine(
                $"{item.Feature.Name} -> " +
                $"{item.Distance:F2} m"
            );
        }


        return [
            .. items.Select(x => x.Feature)
        ];
    }


    /*
     * =========================================================
     * OBTENER FEATURES POR BOUNDING BOX SIN FILTRO DE TIPO
     * =========================================================
     */

    private async Task<List<MountainFeature>>
        GetFeaturesInBoundsWithoutTypeAsync(
            double minLat,
            double maxLat,
            double minLon,
            double maxLon)
    {
        var filter =
            Builders<MountainFeature>.Filter.Gte(
                x => x.Latitude,
                minLat
            )
            &
            Builders<MountainFeature>.Filter.Lte(
                x => x.Latitude,
                maxLat
            )
            &
            Builders<MountainFeature>.Filter.Gte(
                x => x.Longitude,
                minLon
            )
            &
            Builders<MountainFeature>.Filter.Lte(
                x => x.Longitude,
                maxLon
            );

        return await _context.MountainFeatures
            .Find(filter)
            .ToListAsync();
    }


    /*
     * =========================================================
     * DISTANCIA DEL FEATURE AL TRACK
     * =========================================================
     */

    private static double DistanceToTrackMeters(
        double latitude,
        double longitude,
        List<RoutePoint> track)
    {
        var minimumDistance =
            double.MaxValue;

        for (var i = 0; i < track.Count - 1; i++)
        {
            var start = track[i];
            var end = track[i + 1];

            var distance =
                DistancePointToSegmentMeters(
                    latitude,
                    longitude,
                    start.Latitude,
                    start.Longitude,
                    end.Latitude,
                    end.Longitude
                );

            minimumDistance =
                Math.Min(
                    minimumDistance,
                    distance
                );
        }

        return minimumDistance;
    }


    /*
     * =========================================================
     * DISTANCIA PUNTO -> SEGMENTO
     * =========================================================
     */

    private static double DistancePointToSegmentMeters(
        double pointLat,
        double pointLon,
        double startLat,
        double startLon,
        double endLat,
        double endLon)
    {
        const double metersPerDegree = 111_320.0;

        var latitudeRadians =
            startLat *
            Math.PI /
            180.0;

        var longitudeMeters =
            metersPerDegree *
            Math.Cos(latitudeRadians);

        var latitudeMeters =
            metersPerDegree;


        /*
         * Convertimos todo a un sistema local
         * tomando el inicio del segmento como origen.
         */

        var px =
            (pointLon - startLon) *
            longitudeMeters;

        var py =
            (pointLat - startLat) *
            latitudeMeters;

        var bx =
            (endLon - startLon) *
            longitudeMeters;

        var by =
            (endLat - startLat) *
            latitudeMeters;


        /*
         * Vector del segmento
         */

        var dx = bx;
        var dy = by;


        /*
         * Segmento degenerado
         */

        if (dx == 0 && dy == 0)
        {
            return Math.Sqrt(
                px * px +
                py * py
            );
        }


        /*
         * Proyección del punto sobre el segmento
         */

        var t =
            (px * dx + py * dy) /
            (dx * dx + dy * dy);

        t = Math.Max(
            0,
            Math.Min(1, t)
        );


        /*
         * Punto más cercano
         */

        var closestX =
            t * dx;

        var closestY =
            t * dy;


        /*
         * Distancia final
         */

        var distanceX =
            px - closestX;

        var distanceY =
            py - closestY;

        return Math.Sqrt(
            distanceX * distanceX +
            distanceY * distanceY
        );
    }


    /*
     * =========================================================
     * BUSCAR FEATURES POR NOMBRE
     * =========================================================
     */

    public async Task<List<MountainFeature>> SearchFeaturesAsync(
        string name,
        string? type = null)
    {
        var filter =
            Builders<MountainFeature>.Filter.Regex(
                x => x.Name,
                new MongoDB.Bson.BsonRegularExpression(
                    name,
                    "i"
                )
            );

        if (!string.IsNullOrWhiteSpace(type))
        {
            filter &=
                Builders<MountainFeature>.Filter.Eq(
                    x => x.Type,
                    type
                );
        }

        return await _context.MountainFeatures
            .Find(filter)
            .Limit(20)
            .ToListAsync();
    }
}