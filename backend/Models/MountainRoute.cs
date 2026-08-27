using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CeleoxApi.Models;

public class MountainRoute
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // =========================================================
    // DATOS GENERALES DE LA RUTA
    // =========================================================

    public string Name { get; set; } = string.Empty;

    public double DistanceKm { get; set; }

    public double ElevationGain { get; set; }

    public int TotalTimeMinutes { get; set; }

    public int MovingTimeMinutes { get; set; }

    // Recomendaciones generales escritas por el usuario
    public string? PersonalRecommendations { get; set; }

    // =========================================================
    // RECORRIDO COMPLETO
    // =========================================================

    public List<RoutePoint> Track { get; set; } = [];

    // =========================================================
    // TRAMOS
    // =========================================================

    public List<RouteSegment> Segments { get; set; } = [];

    // =========================================================
    // DATOS GENERALES CALCULADOS
    // =========================================================
    //
    // Estos valores NO los introduce el usuario.
    // Se calculan a partir de los tramos.
    //

    public string GeneralDifficulty { get; set; } = string.Empty;

    public string Technique { get; set; } = string.Empty;

    public string AerialExposure { get; set; } = string.Empty;

    public string? NotRecommendedFor { get; set; }

    public string? RecommendedMaterial { get; set; }

    // =========================================================
    // FECHAS
    // =========================================================

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

public class RouteSegment
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public RoutePoint From { get; set; } = new();

    public RoutePoint To { get; set; } = new();
    
    public double? DistanceMeters { get; set; }

    public double? DurationSeconds { get; set; }

    // =========================================================
    // DATOS ELEGIDOS POR EL USUARIO
    // =========================================================

    public string Difficulty { get; set; } = string.Empty;

    public string CriticalSection { get; set; } = string.Empty;

    public string? PersonalRecommendations { get; set; }

    // =========================================================
    // DATOS CALCULADOS AUTOMÁTICAMENTE
    // =========================================================

    public string Technique { get; set; } = string.Empty;

    public string AerialExposure { get; set; } = string.Empty;

    public string? NotRecommendedFor { get; set; }

    public string? RecommendedMaterial { get; set; }

    // =========================================================
    // ELEMENTOS DETECTADOS
    // =========================================================

    public List<string> FeatureIds { get; set; } = [];
}

public class RoutePoint
{
    public double Latitude { get; set; }

    public double Longitude { get; set; }
}