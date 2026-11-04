# S01_THREAD_LIFECYCLE_VERIFICATION_AR

## نطاق الجولة

تشخيص وحل تعليق `run_all_tests.py` بعد انتهاء نتائج `unittest` على `Windows`، من دون تعديل منطق تنزيل الملفات أو تثبيتها أو إزالتها.

- المرجع الأصلي: `fix/f01-safe-uninstall` عند `7f1779f7f6d9d806257f1edf32350944685ac7fc`.
- فرع التشخيص قبل التجربة: `diagnostics/s01-thread-lifecycle-20261104`.
- فرع تجربة الإصلاح: `experiments/s01-fixture-shutdown-20261104`.
- البيئة: `GitHub Actions windows-2022`، `Python 3.13.17`.
- لا تعديل على `main` أو `F-01`، ولا دمج أو نشر، ولا اختبار لمثبت فعلي.

## إثبات السبب قبل تعديل الاختبارات

[تشغيل العزل الأصلي 41767960970](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41767960970).

| الوحدة | نتيجة التأكيدات | رمز العملية | المراقبة |
|---|---|---|---|
| `test_analytics` | `5 PASS` | `124` | `TIMED_OUT=1` بعد `115s` |
| `test_proxy_vault` | `5 PASS` | `124` | `TIMED_OUT=1` بعد `115s` |
| `test_web_remote` | `6 PASS` | `124` | `TIMED_OUT=1` بعد `115s` |
| `test_queue_system` | `6 PASS` | `0` | خروج طبيعي |
| `test_regression` | `3 PASS, 1 ERROR` | `1` | خروج طبيعي، خطأ واجهة مستقل |
| `test_media_grabber` | `4 PASS, 1 FAIL` | `1` | خروج طبيعي، فشل وسائط مستقل |

في المجموعات الثلاث المعلّقة، عاد `TextTestRunner` وأبلغ عن نجاح التأكيدات، لكن بقي خيط `pystray._win32._mainloop` غير `daemon` باسم `Thread-3 (<lambda>)`، والخيط الرئيسي داخل `threading._shutdown`. ظهرت خيوط `socketserver.serve_forever` بوصفها `daemon`؛ لذا لا تثبت وحدها سبب منع الخروج.

**سبب في الشيفرة:** كل من `TestAnalyticsDialog` في `test_analytics.py`، و`TestPhase11Dialogs` في `test_proxy_vault.py`، و`TestPhase12Dialogs` في `test_web_remote.py` كان يستدعي `cls.app.is_closing=True` ثم `cls.app.destroy()`؛ ما يتجاوز مسار `NexusStreamManagerApp.on_close()` الذي يوقف أيقونة النظام وخادم الربط.

## التعديل التجريبي الدقيق

في **ملفات الاختبار الأربعة فقط**، استُبدل `tearDownClass` بالترتيب التالي:

1. عند عدم إنشاء التطبيق، عُد دون عمل.
2. اضبط `cls.app.force_exit=True` لكي لا يتحول الإغلاق إلى إخفاء التطبيق في شريط النظام.
3. احجب `cls.app.save_state` داخل الاختبار بواسطة `unittest.mock.patch.object`، حتى لا تُحفظ إعدادات الاختبارات.
4. استدعِ `cls.app.on_close()` لكي يعمل تنظيف `tray_icon.stop()` و`bridge_server.stop()` و`destroy()` بالطريق الأصلي.

لم تُستخدم `os._exit()` أو `daemon=True` لإخفاء المشكلة، ولم تُعطَّل الاختبارات أو تُعدّل شيفرة التطبيق.

## نتيجة الاختبارات بعد التعديل

[تشغيل المقارنة 41768276941](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41768276941).

| الوحدة | نتيجة التأكيدات | رمز العملية | مدة العملية |
|---|---|---|---|
| `test_analytics` | `5 PASS` | `0` | `4.98s` |
| `test_proxy_vault` | `5 PASS` | `0` | `6.51s` |
| `test_web_remote` | `6 PASS` | `0` | `7.13s` |
| `test_queue_system` (ضابط) | `6 PASS` | `0` | `10.77s` |

في الاختبارات المعنية، لم يبق خيط `pystray` غير `daemon` عند عودة المجموعة؛ ظهرت فقط الخيوط `daemon` للخوادم المؤقتة، التي لا تعطل خروج المفسر. النتيجة تثبت إغلاق **التعليق المعزول** على بيئة الاختبار هذه.

## اختبار المجموعة الكاملة قبل وبعد إصلاح أربعة تجهيزات

- [تشغيل 41768406281](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41768406281)، بعد تعديل ثلاثة تجهيزات فقط: `Ran 106`، `FAILED (failures=2, errors=1)`، `EXIT=124`، `TIMED_OUT=1` بعد 260 ثانية، وبقي خيط `pystray._win32._mainloop`. لم يكن الإصلاح الثلاثي كافيًا.
- كشف فحص `test_link_recovery.py` تجهيزًا رابعًا يستدعي `is_closing=True` ثم `destroy()` متجاوزًا التنظيف. أُضيف له `force_exit=True` ثم `on_close()` مع حجب `save_state`. [اختبار العزل 41768770566](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41768770566) تحقق من `5 PASS`، `EXIT=0` و`TIMED_OUT=0` خلال `6.34s`.
- [تشغيل المجموعة الكاملة 41768775871](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41768775871)، مع الإصلاح الرابع: `Ran 106` في `72.963s`، `FAILED (failures=1, errors=1)` لكن العملية خرجت **طبيعيًا** بالرمز `EXIT=1`، `TIMED_OUT=0`، `ELAPSED_SEC=74.54`. بذلك **أُغلق تعليق العملية في هذه البيئة**؛ ولا يجوز وصف المجموعة كلها بـ`PASS` بسبب إخفاقَي الواجهة والوسائط المتبقيين.

## فحص إضافي لاعتماد اختبار الوسائط على yt-dlp

في `MediaGrabberDialog._submit`، إذا لم يُعثر على `yt-dlp` ينتقل التنفيذ إلى تثبيت المحرك ثم يعود من غير إضافة مهمة. اختبار `test_04_stream_badge_and_mock_analysis` يفترض ضمنيًا وجود التنفيذي. أُدخل `patch("ui_dialogs.find_ytdlp_executable", return_value=...)` ضمن سياق إنشاء المهمة المؤجلة في الاختبار فقط، بلا تنزيل أو استبدال المحرك في التطبيق. حالة [التحقق 41769180047](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41769180047) **قيد القراءة**؛ لا يُعتبر الإصلاح ناجحًا قبل ظهور الاختبار ورمز خروجه. خطأ إنشاء `CommandPaletteDialog` في `test_regression` ما زال مستقلًا ولم يُغيَّر لإخفائه.

## قرار مرحلي

- **تصحيح تجهيزات الاختبارات الأربعة:** `GO` على مستوى اختبارات الوحدات المعزولة فقط.
- **حالة S-01 الكاملة:** `CONDITIONAL GO` لحين نتيجة المجموعة الكاملة وعدم ظهور انحدار.
- **شيفرة F-01:** لم تُمس، ونتائج Windows السابقة `62 PASS` مع `symlink PASS` باقية.
- **دمج إلى main أو إصدار حزمة:** `NO-GO`؛ يحتاجان شروطهما المستقلة.

## ضمانات السلامة والتراجع

التغييرات التي عالجت التعليق محصورة في أربعة ملفات اختبار وأدوات CI على فروع منفصلة. لم يُعدَّل المثبت أو محرك التنزيل. للإلغاء يمكن `git revert` للالتزامات التجريبية الثلاثة بالترتيب العكسي، بعد التحقق من `HEAD` الحالي؛ لا تستخدم `reset --hard` أو `clean -fdx`.
