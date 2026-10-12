namespace DateTimeChecker.Api.Models;

// Keep raw text: format and range errors are part of the requirement.
public sealed record CheckDateRequest(string? Day, string? Month, string? Year);
