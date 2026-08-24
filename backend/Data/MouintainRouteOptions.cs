namespace CeleoxApi.Data;

public record MountainRouteDifficulty(
    string Technique,
    string AerialExposure,
    string GeneralDifficulty,
    string NotRecommendedFor,
    string RecommendedMaterial
);

public static class MountainRouteOptions
{
    public static readonly string[] CriticalSections =
    [
        "Pista",
        "Sendero/Corriol",
        "Tartera",
        "Roca vertical",
        "Roca vertical aérea"
    ];

    public static readonly Dictionary<string, MountainRouteDifficulty>
        DifficultyByCriticalSection = new()
        {
            ["Pista"] = new(
                "Dominguero",
                "Nula",
                "Nula",
                "Sin recomendación",
                "Sin material"
            ),

            ["Sendero/Corriol"] = new(
                "Amateur",
                "Baja",
                "Baja",
                "Mascotas",
                "Arnés"
            ),

            ["Tartera"] = new(
                "Senderista",
                "Moderada",
                "Moderada",
                "Mascotas inexpertas",
                "Cuerda"
            ),

            ["Roca vertical"] = new(
                "Grimpador",
                "Alta",
                "Alta",
                "Niños",
                "Sin material"
            ),

            ["Roca vertical aérea"] = new(
                "Escalador",
                "Extrema",
                "Extrema",
                "Niños sin experiencia",
                "Sin material"
            )
        };
}