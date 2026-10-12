namespace DateTimeChecker.Api.Models;

public sealed record CheckDateResult(
    string Outcome,
    bool? IsValid,
    string Message,
    string? Field = null,
    string? NormalizedDate = null,
    int? DaysInMonth = null,
    bool? IsLeapYear = null);
