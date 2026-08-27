using CeleoxApi.Data;
using CeleoxApi.Models;
using MongoDB.Driver;

namespace CeleoxApi.Services;

public class MountainRouteService(MongoDbContext context)
{
    private readonly MongoDbContext _context = context;

    public async Task<List<MountainRoute>> GetAllAsync()
    {
        return await _context.MountainRoutes
            .Find(_ => true)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<MountainRoute?> GetByIdAsync(string id)
    {
        if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
            return null;

        return await _context.MountainRoutes
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<MountainRoute> CreateAsync(
        MountainRoute route)
    {
        ValidateRoute(route);

        ApplySegmentDifficultyData(route);
        ApplyGeneralDifficultyData(route);

        route.Id = null;

        route.CreatedAt = DateTime.UtcNow;
        route.UpdatedAt = DateTime.UtcNow;

        await _context.MountainRoutes.InsertOneAsync(route);

        return route;
    }

    public async Task<bool> UpdateAsync(
        string id,
        MountainRoute route)
    {
        if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
            return false;

        ValidateRoute(route);

        ApplySegmentDifficultyData(route);
        ApplyGeneralDifficultyData(route);

        route.Id = id;

        route.UpdatedAt = DateTime.UtcNow;

        var result =
            await _context.MountainRoutes.ReplaceOneAsync(
                x => x.Id == id,
                route
            );

        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
            return false;

        var result =
            await _context.MountainRoutes.DeleteOneAsync(
                x => x.Id == id
            );

        return result.DeletedCount > 0;
    }

    // =========================================================
    // CALCULAR DATOS DE CADA TRAMO
    // =========================================================

    private static void ApplySegmentDifficultyData(
        MountainRoute route)
    {
        foreach (var segment in route.Segments)
        {
            if (!MountainRouteOptions
                .DifficultyByCriticalSection
                .TryGetValue(
                    segment.CriticalSection,
                    out var difficulty))
            {
                throw new ArgumentException(
                    $"Sección crítica no válida en el tramo '{segment.Name}': {segment.CriticalSection}"
                );
            }

            /*
             * Estos datos los calcula el backend a partir
             * de la sección crítica seleccionada por el usuario.
             */

            segment.Technique =
                difficulty.Technique;

            segment.AerialExposure =
                difficulty.AerialExposure;

            segment.NotRecommendedFor =
                difficulty.NotRecommendedFor;

            segment.RecommendedMaterial =
                difficulty.RecommendedMaterial;
        }
    }

    // =========================================================
    // CALCULAR INFORMACIÓN GENERAL DE LA RUTA
    // =========================================================

    private static void ApplyGeneralDifficultyData(
        MountainRoute route)
    {
        if (route.Segments.Count == 0)
        {
            route.GeneralDifficulty = string.Empty;
            route.Technique = string.Empty;
            route.AerialExposure = string.Empty;
            route.NotRecommendedFor = null;
            route.RecommendedMaterial = null;

            return;
        }

        /*
         * La dificultad general se obtiene de la dificultad
         * más alta existente entre todos los tramos.
         */

        var difficultyOrder =
            new Dictionary<string, int>
            {
                ["Muy fácil"] = 0,
                ["Fácil"] = 1,
                ["Moderada"] = 2,
                ["Difícil"] = 3,
                ["Muy difícil"] = 4,
            };

        var hardestSegment =
            route.Segments
                .OrderByDescending(
                    segment =>
                        difficultyOrder.TryGetValue(
                            segment.Difficulty,
                            out var value
                        )
                            ? value
                            : -1
                )
                .First();

        route.GeneralDifficulty =
            hardestSegment.Difficulty;

        /*
         * Para los demás datos generales usamos también
         * el tramo más exigente.
         */

        route.Technique =
            hardestSegment.Technique;

        route.AerialExposure =
            hardestSegment.AerialExposure;

        route.NotRecommendedFor =
            hardestSegment.NotRecommendedFor;

        route.RecommendedMaterial =
            hardestSegment.RecommendedMaterial;
    }

    // =========================================================
    // VALIDACIÓN
    // =========================================================

    private static void ValidateRoute(
        MountainRoute route)
    {
        if (string.IsNullOrWhiteSpace(route.Name))
        {
            throw new ArgumentException(
                "El nombre de la ruta es obligatorio."
            );
        }

        if (route.Name.Length > 150)
        {
            throw new ArgumentException(
                "El nombre de la ruta no puede superar los 150 caracteres."
            );
        }

        if (route.DistanceKm <= 0)
        {
            throw new ArgumentException(
                "La distancia debe ser mayor que 0."
            );
        }

        if (route.ElevationGain < 0)
        {
            throw new ArgumentException(
                "El desnivel positivo no puede ser negativo."
            );
        }

        if (route.TotalTimeMinutes <= 0)
        {
            throw new ArgumentException(
                "El tiempo total debe ser mayor que 0."
            );
        }

        if (route.MovingTimeMinutes <= 0)
        {
            throw new ArgumentException(
                "El tiempo en movimiento debe ser mayor que 0."
            );
        }

        if (
            route.MovingTimeMinutes >
            route.TotalTimeMinutes
        )
        {
            throw new ArgumentException(
                "El tiempo en movimiento no puede ser superior al tiempo total."
            );
        }

        // =====================================================
        // TRACK
        // =====================================================

        if (
            route.Track == null ||
            route.Track.Count < 2
        )
        {
            throw new ArgumentException(
                "La ruta debe tener al menos dos puntos."
            );
        }

        foreach (var point in route.Track)
        {
            ValidatePoint(point);
        }

        // =====================================================
        // TRAMOS
        // =====================================================

        if (
            route.Segments == null ||
            route.Segments.Count == 0
        )
        {
            throw new ArgumentException(
                "La ruta debe contener al menos un tramo."
            );
        }

        foreach (var segment in route.Segments)
        {
            ValidateSegment(segment);
        }

        // =====================================================
        // RECOMENDACIONES GENERALES
        // =====================================================

        if (
            route.PersonalRecommendations != null &&
            route.PersonalRecommendations.Length > 1000
        )
        {
            throw new ArgumentException(
                "Las recomendaciones personales no pueden superar los 1000 caracteres."
            );
        }
    }

    // =========================================================
    // VALIDAR TRAMO
    // =========================================================

    private static void ValidateSegment(
        RouteSegment segment)
    {
        if (string.IsNullOrWhiteSpace(segment.Id))
        {
            throw new ArgumentException(
                "Cada tramo debe tener un identificador."
            );
        }

        if (string.IsNullOrWhiteSpace(segment.Name))
        {
            throw new ArgumentException(
                "Todos los tramos deben tener un nombre."
            );
        }

        if (segment.Name.Length > 150)
        {
            throw new ArgumentException(
                $"El nombre del tramo '{segment.Name}' no puede superar los 150 caracteres."
            );
        }

        if (string.IsNullOrWhiteSpace(segment.Difficulty))
        {
            throw new ArgumentException(
                $"El tramo '{segment.Name}' debe tener una dificultad."
            );
        }

        if (string.IsNullOrWhiteSpace(segment.CriticalSection))
        {
            throw new ArgumentException(
                $"El tramo '{segment.Name}' debe tener una sección crítica."
            );
        }

        if (
            !MountainRouteOptions
                .CriticalSections
                .Contains(segment.CriticalSection)
        )
        {
            throw new ArgumentException(
                $"Sección crítica no válida en el tramo '{segment.Name}': {segment.CriticalSection}"
            );
        }

        if (
            segment.PersonalRecommendations != null &&
            segment.PersonalRecommendations.Length > 1000
        )
        {
            throw new ArgumentException(
                $"Las recomendaciones del tramo '{segment.Name}' no pueden superar los 1000 caracteres."
            );
        }

        ValidatePoint(segment.From);
        ValidatePoint(segment.To);

        if (
            segment.DistanceMeters.HasValue &&
            segment.DistanceMeters.Value < 0
        )
        {
            throw new ArgumentException(
                $"La distancia del tramo '{segment.Name}' no puede ser negativa."
            );
        }

        if (
            segment.DurationSeconds.HasValue &&
            segment.DurationSeconds.Value < 0
        )
        {
            throw new ArgumentException(
                $"La duración del tramo '{segment.Name}' no puede ser negativa."
            );
        }
    }

    // =========================================================
    // VALIDAR PUNTO
    // =========================================================

    private static void ValidatePoint(
        RoutePoint point)
    {
        if (
            point.Latitude < -90 ||
            point.Latitude > 90
        )
        {
            throw new ArgumentException(
                "La latitud de un punto no es válida."
            );
        }

        if (
            point.Longitude < -180 ||
            point.Longitude > 180
        )
        {
            throw new ArgumentException(
                "La longitud de un punto no es válida."
            );
        }
    }
}