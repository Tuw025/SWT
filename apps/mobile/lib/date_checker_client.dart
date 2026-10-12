import 'dart:convert';
import 'package:http/http.dart' as http;

class CheckDateResult {
  const CheckDateResult({
    required this.outcome,
    required this.message,
    this.field,
    this.isValid,
  });

  final String outcome;
  final String message;
  final String? field;
  final bool? isValid;

  factory CheckDateResult.fromJson(Map<String, dynamic> json) {
    final outcome = json['outcome'];
    final message = json['message'];
    if (outcome is! String || message is! String) {
      throw const FormatException('Unexpected checker response');
    }
    return CheckDateResult(
      outcome: outcome,
      message: message,
      field: json['field'] as String?,
      isValid: json['isValid'] as bool?,
    );
  }
}

class DateCheckerClient {
  DateCheckerClient({required String baseUrl})
      : _endpoint = Uri.parse('${baseUrl.replaceFirst(RegExp(r'/+$'), '')}/api/date/check');

  final Uri _endpoint;

  Future<CheckDateResult> check({
    required String day,
    required String month,
    required String year,
  }) async {
    // A client per operation lets finally close the connection even after a timeout.
    final client = http.Client();
    try {
      final response = await client.post(
        _endpoint,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'day': day, 'month': month, 'year': year}),
      ).timeout(const Duration(seconds: 5));
      if (response.statusCode != 200 && response.statusCode != 422) {
        throw const FormatException('Unexpected checker status');
      }
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Unexpected checker response');
      }
      return CheckDateResult.fromJson(decoded);
    } finally {
      client.close();
    }
  }
}
