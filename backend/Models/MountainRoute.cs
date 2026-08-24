using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CeleoxApi.Models;

public class MountainRoute
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public double DistanceKm { get; set; }

    public double ElevationGain { get; set; }

    public int TotalTimeMinutes { get; set; }

    public int MovingTimeMinutes { get; set; }

    // Calculado automáticamente a partir de CriticalSection
    public string GeneralDifficulty { get; set; } = string.Empty;

    // El usuario selecciona este valor
    public string CriticalSection { get; set; } = string.Empty;

    // Calculados automáticamente
    public string Technique { get; set; } = string.Empty;

    public string AerialExposure { get; set; } = string.Empty;

    public string? NotRecommendedFor { get; set; }

    public string? RecommendedMaterial { get; set; }

    // Texto introducido por el usuario
    public string? PersonalRecommendations { get; set; }

    // Puntos que forman el trazado de la ruta
    public List<RoutePoint> Track { get; set; } = [];

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

public class RoutePoint
{
    public double Latitude { get; set; }

    public double Longitude { get; set; }
}