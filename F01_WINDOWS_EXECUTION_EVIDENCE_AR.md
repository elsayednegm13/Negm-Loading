# F01_WINDOWS_EXECUTION_EVIDENCE_AR

## التقرير العملي — 2026-11-04

**النطاق:** تشغيل اختبارات موجودة لشيفرة F-01 على Windows مستقل، وتشخيص مشكلة عدم خروج `run_all_tests.py`. هذا تقرير تحقيق على فرع `verification/f01-windows-evidence-20261104`، وليس إعلان إصدار أو دمج.

**مرجع الشيفرة:** بدأ فرع التحقق من `fix/f01-safe-uninstall` عند `7f1779f7f6d9d806257f1edf32350944685ac7fc`؛ لم نُعدّل `installer_engine.py` أو `installer_safety.py`. أي تغييرات لاحقة هنا تخص إعداد CI وتجربة تنظيف الاختبارات فقط. لم يتغير `main`، ولم يُدمج `PR #1`.

## النتائج المحققة

| الحالة | التشغيل | النتيجة |
|---|---|---|
| Windows 2022 / Python 3.13.17 / `pwsh` + مجموعة F-01 | [41736678766](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41736678766) | `Ran 62`؛ `21 failures`، `EXIT=1`. غالبية الاختبارات توقفت عند `uninstall.cmd` برمز `3`، وظهر إخفاق تحميل `Microsoft.PowerShell.Security` في اختبار `Get-Acl`. |
| Windows 2022 / Python 3.13.17 / `cmd` + المجموعة نفسها | [41737106461](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41737106461) | `Ran 62`، `OK`، `0 SKIP`، `EXIT=0`. اختبار `test_symlink_file_redirection_is_preserved` نجح `ok`. |
| إعادة تأكيد الاختبارات من `cmd` دون تعديل شيفرة المنتج | [41737547189](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41737547189) | `Ran 62 in 38.096s`، `OK`، `EXIT=0`، `TIMED_OUT=0`، `0 SKIP`. |
| المجموعة الكاملة من `pwsh` | [41736678766](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41736678766) | `Ran 106`، `23 failures`، `1 error`، وتعليق حتى مراقب `260s`، `EXIT=124`. ليس نجاحًا. |
| المجموعة الكاملة من `cmd`، قبل تجربة إصلاح الاختبارات | [41737547189](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41737547189) | `Ran 106`، `1 failure`، `1 error`، وتعليق حتى `260s`، `EXIT=124`. ليس نجاحًا. |

**حالة تجربة تنظيف اختبارات الواجهة:** جارية ضمن [تشغيل 41738185828](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41738185828). تُحدّث نتيجتها هنا بعد استخراج رموز الخروج الفعلية. التعديلات التجريبية على `test_proxy_vault.py` و`test_web_remote.py` **لم تُنقل إلى فرع F-01**.

## تحليل أولي قائم على الأدلة

1. اختبارات `F-01` نجحت كاملة بما فيها `symlink` عند بدء `Python` من `cmd` في Windows معزول. هذا يحسم SKIP السابق على مستوى اختبار الربط الرمزي المحدد، ولا يعني أن جميع حالات إعادة التوجيه اختُبرت.
2. تغيير مضيف تشغيل الاختبارات من `pwsh` إلى `cmd` وحده أزال 21 إخفاقًا، لذلك هناك **اعتماد على بيئة تشغيل Windows PowerShell**؛ السبب الدقيق (توريث متغيرات بيئة الوحدات أو غيرها) لم يُثبت بعد. `Get-Acl` لم يُحمَّل تلقائيًا في أحد الاختبارات على المضيف الأول، بينما نجح اختبار استيراد الوحدة صراحةً في المقارنة.
3. عند تشغيل المجموعة الكاملة من `cmd` بقي خطأ `_tkinter.TclError: bad window path name ".!commandpalettedialog"` في `test_regression.test_04_app_headless_lifecycle`، وفشل توقع إضافة مهمة في `test_media_grabber.test_04_stream_badge_and_mock_analysis`؛ كلاهما خارج شيفرة F-01.
4. كشف `faulthandler` خيوطًا لا تزال تعمل في `pystray._win32._mainloop` و`socketserver.serve_forever` بينما كان الخيط الرئيسي داخل `threading._shutdown`. يثبت ذلك وجود دورة حياة غير مكتملة للاختبار، لكنه لا يثبت وحده أي خيط بعينه غير `daemon`.
5. في المصدر، `TestPhase11Dialogs.tearDownClass` و`TestPhase12Dialogs.tearDownClass` كانا يضبطان `is_closing=True` ثم يستدعيان `destroy()` مباشرة؛ وهذا يتجاوز إغلاق `on_close()`. جرى تعديل اختباراتهما تجريبيًا على فرع التحقق فقط لاستدعاء `on_close()` مع حجب `save_state` منعًا لكتابة بيانات التطبيق أثناء تنظيف الاختبار.

## الحدود والقرار

- **شيفرة F-01 محل المراجعة:** حصلت على دليل Windows أقوى من نتائج الجهاز المحلي: مجموعة سلامة كاملة `62/62 PASS` مع `symlink PASS`، وخروج طبيعي `0` من `cmd`. لا يُفترض أن نجاح `cmd` يثبت تلقائيًا دعم كل المضيفات الأخرى.
- **الاستقرار الكامل:** `NO-GO` لإعلان نجاح `run_all_tests.py` حتى خروج طبيعي `0` وإغلاق فشلَي اختبارات الواجهة/الوسائط أو تفسيرهما بدليل.
- **إصدار المثبت المعبأ:** `NO-GO`. لم تُنفّذ دورة GUI حقيقية في Windows Sandbox أو آلة افتراضية تفاعلية؛ Windows Actions ليس بديلًا مضمونًا عن تلك الدورة.
- **الترحيل القديم وF-02:** لا تشغيل لـ`uninstall.cmd` القديم الذي يحوي `rd /s /q`، ولا تعديل أسماء التنفيذي هنا.
- **الدمج:** ممنوع. `PR #1` يبقى مفتوحًا وغير مدمج.

## المطلوب عند استكمال تجربة الاختبار

- استخراج نص `Ran ...`، `OK/FAILED`، `EXIT`، `TIMED_OUT` من سجل التشغيل التجريبي.
- إذا لم ينته الخروج، لا تخفيف للمعايير أو تعطيل الاختبارات؛ شخّص مسؤولية كل خيط، وفرق بين عيب اختبار الرأسية ومشكلة دورة حياة الإنتاج.
- لا تنقل أي تعديل من فرع التحقق إلى فرع المنتج قبل نجاح اختبار مقارنة ومراجعة الفرق وتأثيره.
