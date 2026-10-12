import 'dart:convert';
import 'dart:io';
import 'package:integration_test/integration_test_driver.dart';

Future<void> main() async {
  await integrationDriver(
    timeout: const Duration(hours:2),
    writeResponseOnFailure: true,
    responseDataCallback:(data) async {
      final directory=Directory(Platform.environment['LAB_REPORT_DIR']??'../../reports/labs');
      await directory.create(recursive:true);
      await File('${directory.path}/mobile-results.json').writeAsString(const JsonEncoder.withIndent('  ').convert(data));
    },
  );
}
