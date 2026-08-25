namespace CeleoxApi.Models.Routing;

public record RoutePointDto(double Latitude, double Longitude);

public record RouteCalculationRequest(
    RoutePointDto From,
    RoutePointDto To
);

public record RouteCalculationResult(
    List<RoutePointDto> Shape,
    double DistanceMeters,
    double DurationSeconds
);