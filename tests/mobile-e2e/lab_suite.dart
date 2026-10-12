// ignore_for_file: avoid_print
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:date_time_checker/main.dart' as app;
import 'lab_cases.g.dart';

const mode = String.fromEnvironment('LAB_MODE', defaultValue: 'watch');
const caseFilter = String.fromEnvironment('LAB_CASE');
const strictSource = String.fromEnvironment('LAB_STRICT_SOURCE') == '1';
const delayMs = int.fromEnvironment('LAB_DELAY_MS', defaultValue: 700);

class LessonControl extends ChangeNotifier {
  LessonControl(this.caseId, this.input) : paused = mode == 'step';
  final String caseId;
  final String input;
  bool paused;
  bool next = false;
  String label = 'Chuẩn bị';
  String result = '';
  void update(String text) { label = text; next = false; notifyListeners(); }
  void advance() { next = true; notifyListeners(); }
  void toggle() { paused = !paused; notifyListeners(); }
}

Widget harness(LessonControl control) => Directionality(
  textDirection: TextDirection.ltr,
  child: Stack(children: [
    Positioned.fill(
      bottom: mode == 'run' ? 0 : 160,
      child: const app.DateTimeCheckerApp(),
    ),
    if (mode != 'run') Positioned(left: 0, right: 0, bottom: 0,
      child: Material(color: const Color(0xffe8efff), child: SafeArea(top: false,
        child: AnimatedBuilder(animation: control, builder: (context, _) => Padding(
          padding: const EdgeInsets.all(10), child: Column(mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('TEST ${control.caseId}', style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(control.input, maxLines: 1, overflow: TextOverflow.ellipsis),
              Text(control.label, maxLines: 2, overflow: TextOverflow.ellipsis),
              Row(children: [
                FilledButton(key: const ValueKey('lesson-next'), onPressed: control.advance, child: const Text('Tiếp tục')),
                const SizedBox(width: 8),
                TextButton(onPressed: control.toggle, child: Text(control.paused ? 'Chạy tự động' : 'Tạm dừng')),
              ]),
            ]),
        )),
      )),
    ),
  ]),
);

class LessonSteps {
  LessonSteps(this.tester, this.control, this.events);
  final WidgetTester tester;
  final LessonControl control;
  final List<Map<String, dynamic>> events;
  Future<void> realWait(int ms) async {
    await tester.runAsync(() => Future<void>.delayed(Duration(milliseconds: ms)));
  }
  Future<void> step(String label, Future<void> Function() action) async {
    control.update(label);
    print('[${control.caseId}] STEP ${events.length + 1}: $label');
    await tester.pump();
    final wait = Stopwatch()..start();
    while (mode != 'run' && !control.next && (control.paused || wait.elapsedMilliseconds < delayMs)) {
      await realWait(50); await tester.pump();
    }
    final event = <String, dynamic>{'step':events.length+1,'label':label,'startedAt':DateTime.now().toUtc().toIso8601String()};
    events.add(event);
    try { await action(); await tester.pump(); event['result']='PASS'; }
    catch (error) {event['result']='FAIL';event['error']=error.toString();rethrow;}
  }
  Future<void> tapKey(String key) async {
    final finder=find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);await tester.tap(finder);await tester.pump();
  }
  Future<void> waitFor(Finder finder) async {
    final timer=Stopwatch()..start();
    while(finder.evaluate().isEmpty && timer.elapsedMilliseconds<10000){
      await realWait(50);await tester.pump();
    }
    expect(finder,findsOneWidget);
  }
  Future<void> fill(Map<String,dynamic> input) async {
    for(final key in ['day','month','year']){
      await step('Nhập $key = ${jsonEncode(input[key])}',()async{
        final finder=find.byKey(ValueKey('$key-input'));
        await tester.ensureVisible(finder);
        await tester.enterText(finder,input[key] as String);
        await tester.pump();
      });
    }
    // Giấu bàn phím để Check/Clear vẫn nhìn thấy trên màn hình nhỏ.
    FocusManager.instance.primaryFocus?.unfocus();await tester.pumpAndSettle();
  }
  String field(String key)=>tester.widget<TextField>(find.byKey(ValueKey('$key-input'))).controller!.text;
}

void runLabSuite(){
  final binding=IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.framePolicy=LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;
  final catalog=jsonDecode(labCatalogJson) as Map<String,dynamic>;
  final requested=caseFilter.split(',').where((id)=>id.isNotEmpty).toSet();
  final cases=(catalog['cases'] as List<dynamic>).cast<Map<String,dynamic>>().where((c)=>requested.isEmpty||requested.contains(c['id'])).toList();
  if(cases.isEmpty)throw StateError('Không có case mobile: $caseFilter');
  final records=<Map<String,dynamic>>[];
  binding.reportData={'mode':mode,'results':records,'backend':'real HTTP API','note':'SUP-CLOSE-YES kiểm tra yêu cầu SystemNavigator.pop qua platform channel; không chứng minh Activity đã đóng ở hệ điều hành.'};
  for(final c in cases){
    testWidgets('[${c['id']}] ${c['title']}',(tester)async{
      final input=(c['input'] as Map?)?.cast<String,dynamic>()??<String,dynamic>{};
      final control=LessonControl(c['id'] as String,jsonEncode(input));
      final events=<Map<String,dynamic>>[];
      final lesson=LessonSteps(tester,control,events);
      final record=<String,dynamic>{'caseId':c['id'],'source':c['source'],'input':input,'expected':c['expected'],'steps':events};
      records.add(record);
      try{
        // Unmount the previous app so each case starts with fresh state.
        await tester.pumpWidget(const SizedBox.shrink());
        await tester.pumpWidget(harness(control));await tester.pumpAndSettle();
        await lesson.step('Kiểm tra form đã mở',()async=>expect(find.byKey(const ValueKey('day-input')),findsOneWidget));
        final kind=c['kind'] as String;
        if(['check','error-layout','message-layout'].contains(kind)){
          await lesson.fill(input);
          await lesson.step('Bấm Check → gửi dữ liệu tới backend thật',()async{
            await lesson.tapKey('check-button');
            await lesson.waitFor(find.byKey(const ValueKey('dialog-message')));
          });
          await lesson.step('Đối chiếu message và loại dialog',()async{
            final expected=(c['expected'] as Map).cast<String,dynamic>();
            final expectedMessage=strictSource && c['sourceMessage']!=null?c['sourceMessage']:expected['message'];
            final actual=tester.widget<Text>(find.byKey(const ValueKey('dialog-message'))).data;
            record['actual']={'message':actual};
            expect(actual,expectedMessage);
            expect(find.text(expected['outcome']=='validation_error'?'Error':'Message'),findsOneWidget);
            print('[${c['id']}] expected=$expectedMessage actual=$actual');
          });
          if(kind!='check')await lesson.step('Kiểm tra icon, OK và nút X',()async{
            expect(find.byIcon(kind=='error-layout'?Icons.error:Icons.info),findsOneWidget);
            expect(find.byKey(const ValueKey('dialog-ok')),findsOneWidget);
            expect(find.byKey(const ValueKey('dialog-close')),findsOneWidget);
          });
        }else if(kind=='layout'){
          await lesson.step('Kiểm tra logo, tiêu đề, nhãn và ô nhập',()async{
            expect(find.byType(Image),findsOneWidget);
            for(final label in ['Day','Month','Year'])expect(find.text(label),findsOneWidget);
            final title=find.byWidgetPredicate((w)=>w is Text&&w.data=='Date Time Checker'&&w.style?.fontSize==34.67);
            expect(title,findsOneWidget);
            expect(tester.widget<Text>(title).style!.color,const Color(0xff2684ff));
            expect(find.byKey(const ValueKey('clear-button')),findsOneWidget);
            expect(find.byKey(const ValueKey('check-button')),findsOneWidget);
            record['fontLimitation']='Arial được khai báo; font thực tế có thể fallback trên Android.';
          });
        }else if(kind=='clear-layout'){
          await lesson.step('Kiểm tra Clear cạnh Check',()async{
            final clear=find.byKey(const ValueKey('clear-button')),check=find.byKey(const ValueKey('check-button'));
            await tester.ensureVisible(clear);await tester.pumpAndSettle();
            expect(find.text('Clear'),findsOneWidget);
            expect(tester.getRect(clear).left,lessThan(tester.getRect(check).left));
            expect(tester.getRect(clear).top,closeTo(tester.getRect(check).top,2));
          });
        }else if(kind=='clear'){
          await lesson.fill(input);
          await lesson.step('Bấm Clear; kiểm tra ba ô trống',()async{
            await lesson.tapKey('clear-button');
            for(final key in ['day','month','year'])expect(lesson.field(key),'');
          });
        }else{
          if(kind!='confirm-layout')await lesson.fill(input);
          await lesson.step('Bấm X trên form; xem xác nhận thoát',()async{
            await lesson.tapKey('close-button');await lesson.waitFor(find.byKey(const ValueKey('confirm-dialog')));
            expect(find.text('Are you sure to exit?'),findsOneWidget);
          });
          if(kind=='confirm-layout'){
            await lesson.step('Kiểm tra title, icon, Yes/No và X',()async{
              expect(find.text('Confirm'),findsOneWidget);expect(find.byIcon(Icons.info),findsOneWidget);
              for(final key in ['close-no','close-yes','confirm-close'])expect(find.byKey(ValueKey(key)),findsOneWidget);
            });
          }else if(kind=='close-no'){
            await lesson.step('Chọn No; dữ liệu và form được giữ lại',()async{
              await lesson.tapKey('close-no');await tester.pumpAndSettle();
              expect(find.byKey(const ValueKey('confirm-dialog')),findsNothing);
              for(final key in ['day','month','year'])expect(lesson.field(key),input[key]);
            });
          }else if(kind=='close-yes'){
            await lesson.step('Chọn Yes; kiểm tra yêu cầu đóng gửi tới Android',()async{
              var exitRequested=false;
              final messenger=TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
              messenger.setMockMethodCallHandler(SystemChannels.platform,(call)async{
                if(call.method=='SystemNavigator.pop')exitRequested=true;
                return null;
              });
              try{
                await lesson.tapKey('close-yes');await tester.pumpAndSettle();
                expect(exitRequested,isTrue);expect(find.byKey(const ValueKey('closed-screen')),findsOneWidget);
                record['actual']={'nativeExitRequested':true,'evidenceScope':'platform channel request; OS Activity closure remains manual'};
              }finally{messenger.setMockMethodCallHandler(SystemChannels.platform,null);}
            });
          }else{throw StateError('Chưa có handler $kind');}
        }
        await lesson.step('Kết thúc case: các bước kiểm tra đã PASS',()async{});
        record['result']='PASS';
      }catch(error){record['result']='FAIL';record['error']=error.toString();rethrow;}
      finally{
        print('[${c['id']}] ${record['result']}');
        await tester.pumpWidget(const SizedBox.shrink());await tester.pumpAndSettle();
        control.dispose();
      }
    },timeout:const Timeout(Duration(minutes:30)));
  }
}
