import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'date_checker_client.dart';

void main() => runApp(const DateTimeCheckerApp());

class DateTimeCheckerApp extends StatelessWidget {
  const DateTimeCheckerApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Date Time Checker',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff2563eb)),
      scaffoldBackgroundColor: const Color(0xfff2f6fc),
    ),
    home: const DateCheckerScreen(),
  );
}

class DateCheckerScreen extends StatefulWidget {
  const DateCheckerScreen({super.key});

  @override
  State<DateCheckerScreen> createState() => _DateCheckerScreenState();
}

class _DateCheckerScreenState extends State<DateCheckerScreen> {
  final _day = TextEditingController();
  final _month = TextEditingController();
  final _year = TextEditingController();
  final _dayFocus = FocusNode();
  final _monthFocus = FocusNode();
  final _yearFocus = FocusNode();
  late final DateCheckerClient _client;
  bool _busy = false;
  bool _closed = false;
  bool _confirmingClose = false;
  String? _errorField;

  @override
  void initState() {
    super.initState();
    // Android emulator's host machine is 10.0.2.2; physical devices use --dart-define.
    final defaultUrl = !kIsWeb && defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:5080' : 'http://127.0.0.1:5080';
    const configuredUrl = String.fromEnvironment('API_BASE_URL');
    _client = DateCheckerClient(baseUrl: configuredUrl.isEmpty ? defaultUrl : configuredUrl);
  }

  @override
  void dispose() {
    _day.dispose(); _month.dispose(); _year.dispose();
    _dayFocus.dispose(); _monthFocus.dispose(); _yearFocus.dispose();
    super.dispose();
  }

  void _clear() {
    _day.clear(); _month.clear(); _year.clear();
    setState(() => _errorField = null);
    _dayFocus.requestFocus();
  }

  Future<void> _check() async {
    if (_busy) return;
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() { _busy = true; _errorField = null; });
    CheckDateResult result;
    try {
      result = await _client.check(day: _day.text, month: _month.text, year: _year.text);
    } catch (_) {
      result = const CheckDateResult(outcome: 'connection_error',
        message: 'Cannot connect to the checker. Please try again.');
    }
    if (!mounted) return;
    setState(() { _busy = false; _errorField = result.field; });
    final error = result.outcome == 'validation_error' || result.outcome == 'connection_error';
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        key: const ValueKey('message-dialog'),
        title: Row(children: [
          Expanded(child: Text(error ? 'Error' : 'Message')),
          IconButton(key: const ValueKey('dialog-close'), tooltip: 'Close message',
            onPressed: () => Navigator.of(context).pop(), icon: const Icon(Icons.close)),
        ]),
        content: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(error ? Icons.error : Icons.info, color: error ? Colors.red : Colors.blue),
          const SizedBox(width: 12),
          Expanded(child: Text(result.message, key: const ValueKey('dialog-message'))),
        ]),
        actions: [TextButton(key: const ValueKey('dialog-ok'),
          onPressed: () => Navigator.of(context).pop(), child: const Text('OK'))],
      ),
    );
    if (!mounted) return;
    switch (result.field) {
      case 'Day': _dayFocus.requestFocus(); break;
      case 'Month': _monthFocus.requestFocus(); break;
      case 'Year': _yearFocus.requestFocus(); break;
    }
  }

  Future<void> _confirmClose() async {
    if (_busy || _confirmingClose || _closed) return;
    _confirmingClose = true;
    final shouldClose = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        key: const ValueKey('confirm-dialog'),
        title: Row(children: [
          const Expanded(child: Text('Confirm')),
          IconButton(key: const ValueKey('confirm-close'), tooltip: 'Cancel closing',
            onPressed: () => Navigator.of(context).pop(false), icon: const Icon(Icons.close)),
        ]),
        content: const Row(children: [
          Icon(Icons.info, color: Colors.blue), SizedBox(width: 12),
          Expanded(child: Text('Are you sure to exit?')),
        ]),
        actions: [
          TextButton(key: const ValueKey('close-no'), onPressed: () => Navigator.of(context).pop(false), child: const Text('No')),
          FilledButton(key: const ValueKey('close-yes'), onPressed: () => Navigator.of(context).pop(true), child: const Text('Yes')),
        ],
      ),
    );
    _confirmingClose = false;
    if (!mounted || shouldClose != true) return;
    setState(() => _closed = true);
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      await SystemNavigator.pop();
    }
  }

  Widget _field(String label, String hint, TextEditingController controller,
      FocusNode focus, FocusNode? nextFocus) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 64, child: Padding(padding: const EdgeInsets.only(top: 17), child: Text(label))),
      Expanded(child: TextField(
        key: ValueKey('${label.toLowerCase()}-input'),
        controller: controller,
        focusNode: focus,
        enabled: !_busy,
        keyboardType: TextInputType.text,
        textInputAction: nextFocus == null ? TextInputAction.done : TextInputAction.next,
        autocorrect: false,
        enableSuggestions: false,
        onChanged: (_) { if (_errorField == label) setState(() => _errorField = null); },
        onSubmitted: (_) { if (nextFocus != null) { nextFocus.requestFocus(); } else { unawaited(_check()); } },
        decoration: InputDecoration(
          helperText: hint,
          border: const OutlineInputBorder(),
          enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: _errorField == label ? Colors.red : const Color(0xffcbd5e1))),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
      )),
    ]),
  );

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: _closed,
    onPopInvokedWithResult: (didPop, result) { if (!didPop) unawaited(_confirmClose()); },
    child: Scaffold(
      appBar: AppBar(
        title: const Text('Date Time Checker', style: TextStyle(fontSize: 17)),
        actions: _closed ? [] : [IconButton(key: const ValueKey('close-button'),
          tooltip: 'Close application', onPressed: _busy ? null : () => unawaited(_confirmClose()),
          icon: const Icon(Icons.close, color: Colors.red))],
      ),
      body: SafeArea(child: _closed
        ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle_outline, color: Colors.blue, size: 48),
              const SizedBox(height: 16),
              const Text('Application closed', key: ValueKey('closed-screen'), style: TextStyle(fontSize: 24)),
              const SizedBox(height: 20),
              FilledButton(onPressed: () { setState(() => _closed = false); _clear(); }, child: const Text('Open checker')),
            ],
          )))
        : SingleChildScrollView(child: Center(child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Padding(padding: const EdgeInsets.all(24), child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Image.asset('assets/fpt-logo.png', width: 174, height: 57, fit: BoxFit.contain),
                const SizedBox(height: 26),
                const Text('Date Time Checker', style: TextStyle(fontFamily: 'Arial', fontSize: 34.67, color: Color(0xff2684ff))),
                const SizedBox(height: 10),
                const Text('Enter a date to check whether it exists.', style: TextStyle(color: Color(0xff64748b))),
                const SizedBox(height: 28),
                _field('Day', '1–31', _day, _dayFocus, _monthFocus),
                _field('Month', '1–12', _month, _monthFocus, _yearFocus),
                _field('Year', '1000–3000', _year, _yearFocus, null),
                const SizedBox(height: 12),
                Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                  OutlinedButton(key: const ValueKey('clear-button'), onPressed: _busy ? null : _clear, child: const Text('Clear')),
                  const SizedBox(width: 12),
                  FilledButton(key: const ValueKey('check-button'), onPressed: _busy ? null : () => unawaited(_check()),
                    child: Text(_busy ? 'Checking…' : 'Check')),
                ]),
                const SizedBox(height: 28),
                const Center(child: Text('Gregorian calendar · Day / Month / Year',
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Color(0xff64748b)))),
              ],
            )),
          )))),
    ),
  );
}
