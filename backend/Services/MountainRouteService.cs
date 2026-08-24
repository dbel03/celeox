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

        ApplyDifficultyData(route);

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

        ApplyDifficultyData(route);

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

    private static void ApplyDifficultyData(
        MountainRoute route)
    {
        if (!MountainRouteOptions.DifficultyByCriticalSection
            .TryGetValue(
                route.CriticalSection,
                out var difficulty))
        {
            throw new ArgumentException(
                $"Tramo crítico no válido: {route.CriticalSection}"
            );
        }

        route.Technique =
            difficulty.Technique;

        route.AerialExposure =
            difficulty.AerialExposure;

        route.GeneralDifficulty =
            difficulty.GeneralDifficulty;

        route.NotRecommendedFor =
            difficulty.NotRecommendedFor;

        route.RecommendedMaterial =
            difficulty.RecommendedMaterial;
    }

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

        if (route.MovingTimeMinutes >
            route.TotalTimeMinutes)
        {
            throw new ArgumentException(
                "El tiempo en movimiento no puede ser superior al tiempo total."
            );
        }

        if (!MountainRouteOptions.CriticalSections.Contains(
                route.CriticalSection))
        {
            throw new ArgumentException(
                $"Tramo crítico no válido: {route.CriticalSection}"
            );
        }

        if (route.Track == null ||
            route.Track.Count < 2)
        {
            throw new ArgumentException(
                "La ruta debe tener al menos dos puntos."
            );
        }

        foreach (var point in route.Track)
        {
            if (point.Latitude < -90 ||
                point.Latitude > 90)
            {
                throw new ArgumentException(
                    "La latitud de un punto no es válida."
                );
            }

            if (point.Longitude < -180 ||
                point.Longitude > 180)
            {
                throw new ArgumentException(
                    "La longitud de un punto no es válida."
                );
            }
        }

        if (route.PersonalRecommendations != null &&
            route.PersonalRecommendations.Length > 1000)
        {
            throw new ArgumentException(
                "Las recomendaciones personales no pueden superar los 1000 caracteres."
            );
        }
    }
}