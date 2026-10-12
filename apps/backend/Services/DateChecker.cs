using System.Globalization;
using DateTimeChecker.Api.Models;

namespace DateTimeChecker.Api.Services;

public sealed class DateChecker
{
    public CheckDateResult Check(CheckDateRequest request)
    {
        // Stop at the first error in the documented Day -> Month -> Year order.
        var dayError = ParseField(request.Day, "Day", 1, 31, out var day);
        if (dayError is not null) return dayError;
        var monthError = ParseField(request.Month, "Month", 1, 12, out var month);
        if (monthError is not null) return monthError;
        var yearError = ParseField(request.Year, "Year", 1000, 3000, out var year);
        if (yearError is not null) return yearError;

        var leapYear = IsLeapYear(year);
        var maximumDay = DaysInMonth(year, month);
        var valid = day <= maximumDay;
        var date = string.Create(CultureInfo.InvariantCulture, $"{day:00}/{month:00}/{year:0000}");
        return new CheckDateResult(
            valid ? "valid_date" : "invalid_date",
            valid,
            valid ? $"{date} is correct date time!" : $"{date} is NOT correct date time!",
            NormalizedDate: date,
            DaysInMonth: maximumDay,
            IsLeapYear: leapYear);
    }

    // Explicit branches preserve the algorithm in the supplied flowchart.
    private static bool IsLeapYear(int year)
    {
        // Gregorian leap-year rule: years divisible by 400 are leap years.
        if (year % 400 == 0) return true;
        if (year % 100 == 0) return false;
        return year % 4 == 0;
    }

    private static int DaysInMonth(int year, int month) => month switch
    {
        1 or 3 or 5 or 7 or 8 or 10 or 12 => 31,
        4 or 6 or 9 or 11 => 30,
        2 => IsLeapYear(year) ? 29 : 28,
        _ => 0
    };

    private static CheckDateResult? ParseField(
        string? raw, string field, int minimum, int maximum, out int value)
    {
        value = 0;
        var text = raw?.Trim() ?? "";
        // Integers may have a leading sign. Decimal and exponent notation are rejected.
        var hasSign = text.StartsWith('+') || text.StartsWith('-');
        var digits = hasSign ? text[1..] : text;
        if (digits.Length == 0 || digits.Any(character => character is < '0' or > '9'))
        {
            return new CheckDateResult("validation_error", null,
                $"Input data for {field} is incorrect format!", field);
        }

        // Strip leading zeroes before parsing, so large integers are range errors,
        // while text such as 0000000000000000000001 remains a valid integer.
        var significant = digits.TrimStart('0');
        if (significant.Length == 0) significant = "0";
        if (hasSign) significant = text[0] + significant;
        if (!int.TryParse(significant, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out value)
            || value < minimum || value > maximum)
        {
            return new CheckDateResult("validation_error", null,
                $"Input data for {field} is out of range!", field);
        }
        return null;
    }
}
