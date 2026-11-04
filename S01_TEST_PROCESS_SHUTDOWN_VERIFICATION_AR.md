# S01_TEST_PROCESS_SHUTDOWN_VERIFICATION_AR

## 1. نطاق الإصلاح — 2026-11-04

هدف المهمة: معالجة عدم خروج `run_all_tests.py` طبيعيًا بعد انتهاء اختبارات الوحدة، من دون تعديل وظائف التطبيق أو محرك التنزيل أو المثبت.

**الفرع المستقل:** `fix/s01-test-process-shutdown`، مشتق من `main` عند `f17f942f0be63ea4564378a2997669a5b5cd4869`؛ منفصل عن `fix/f01-safe-uninstall`. لم يُدمج أي طلب سحب ولم يُنشر إصدار.

**الملفات المعدلة:** `test_analytics.py`، `test_proxy_vault.py`، `test_web_remote.py`، `test_link_recovery.py`، `test_media_grabber.py`. أُضيف ملف تشغيل اختبار `.github/workflows/s01-windows-smoke.yml`. **لا تعديل في شيفرة المنتج**.

## 2. إثبات السبب الجذري قبل الإصلاح

التشخيص السابق على `diagnostics/s01-thread-lifecycle-20261104`، [تشغيل 41767960970](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41767960970):

| المجموعة | نتائج التأكيدات | العملية الفعلية | الحالة |
|---|---|---|---|
| `test_analytics` | `5 PASS` | `EXIT=124` بعد 115s | تعليق |
| `test_proxy_vault` | `5 PASS` | `EXIT=124` بعد 115s | تعليق |
| `test_web_remote` | `6 PASS` | `EXIT=124` بعد 115s | تعليق |
| `test_queue_system` | `6 PASS` | `EXIT=0` | خرج طبيعيًا |
| `test_regression` | خطأ واجهة واحد | `EXIT=1` | خرج طبيعيًا |
| `test_media_grabber` | فشل اختبار وسائط واحد | `EXIT=1` | خرج طبيعيًا |

عند انتهاء المجموعات الثلاث المعلّقة كان `TextTestRunner` قد عاد، لكن ظل خيط غير `daemon` من `pystray._win32._mainloop`، والخيط الرئيسي ينتظر داخل `threading._shutdown`. خيوط `socketserver` المعروضة كانت `daemon` ولا يُعتبر وجودها وحده سبب منع الخروج.

**السبب في مصدر الاختبارات:** `tearDownClass` ضمن `TestAnalyticsDialog` و`TestPhase11Dialogs` و`TestPhase12Dialogs` و`TestLinkRecoveryDialogs` كان يتجاوز تنظيف التطبيق، بضبط `app.is_closing=True` ثم `app.destroy()`. يُفترض استعمال `NexusStreamManagerApp.on_close()` لإيقاف أيقونة النظام وخادم المتصفح.

## 3. التغيير المحدود

- ملفات الاختبارات الأربع تُجبر الإغلاق النهائي عبر `app.force_exit=True`، ثم تستدعي `app.on_close()` ضمن `patch.object(app, "save_state", return_value=None)` لحجب كتابة حالة اختبار غير مطلوبة. لم تُعطّل أي تأكيدات ولم تُحوَّل الخيوط إلى `daemon` لستر المشكلة.
- `test_media_grabber.py` يحقن قيمة اختبارية لـ`ui_dialogs.find_ytdlp_executable` **أثناء إنشاء مهمة وسائط مؤجلة فقط**، كي يختبر إضافة المهمة دون تنزيل أو تشغيل `yt-dlp` حقيقي. لا يغيّر منطق التطبيق ولا يُثبت تكامل المحرك الحقيقي.

## 4. الأدلة بعد الإصلاح

**أ. اختبارات الوحدة المعزولة:** [تشغيل 41768276941](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41768276941): `test_analytics` = 5/5، `test_proxy_vault` = 5/5، `test_web_remote` = 6/6؛ جميعها `EXIT=0` و`TIMED_OUT=0`. مجموعة `test_queue_system` الضابطة 6/6، `EXIT=0`.

**ب. اختبار استرداد الروابط:** [تشغيل 41768770566](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41768770566): `test_link_recovery` = 5/5، `EXIT=0`، `TIMED_OUT=0`، `6.34s`.

**ج. إصلاح تعليق المجموعة الكاملة:** بعد ثلاث تجهيزات فقط، [تشغيل 41768406281](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41768406281) ظل معلقًا وانتهى بمهلة `EXIT=124` بعد `260s`. بعد إصلاح التجهيز الرابع، [تشغيل 41768775871](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41768775871): `Ran 106 tests`، `FAILED (failures=1, errors=1)`، لكن خرجت العملية طبيعيًا `EXIT=1`، `TIMED_OUT=0`، في `74.54s`. بذلك **ثبت اختفاء تعليق العملية في هذه البيئة**، لكن المجموعة لم تصبح ناجحة.

**د. اختبار الوسائط:** [تشغيل 41769180047](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41769180047): مجموعة `test_media_grabber` أعطت `5 PASS`، `EXIT=0`، `TIMED_OUT=0`، `8.59s`. المجموعة الكاملة في التشغيل نفسه أعطت `Ran 106 tests`، مع **خطأ واحد في `test_regression.test_04_app_headless_lifecycle`**، `EXIT=1`، `TIMED_OUT=0`، `73.94s`؛ لم تختف مشكلة النافذة بعد.

**هـ. اختبار الفرع المستقل النظيف:** [تشغيل 41769823347](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41769823347)، على فرع `fix/s01-test-process-shutdown` المشتق من `main`: ترجمة الوحدات `PASS`، وتشغيل `26` اختبارًا من الوحدات الخمس **`OK`** في `15.472s`، والعملية خرجت طبيعيًا `EXIT=0`. لم تُتخطَّ اختبارات.

## 5. الفرضية التي اختُبرت ولم تُعتمد

جُرب تعديل `test_regression.py` لضبط عدد جذور `CTk` ومسح ذاكرة الخطوط عند تغيير المفسر. [تشغيل 41769534143](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41769534143) أعاد `_tkinter.TclError: bad window path name ".!commandpalettedialog"`، لذا أُعيد الملف إلى حالته الأصلية. **هذا التعديل غير موجود في فرع الإصلاح المستقل**. لا ينبغي تجاوز اختبار نافذة الأوامر أو إخفاء الاستثناء لجعل المجموعة خضراء.

## 6. القرار والمخاطر

| النطاق | الحكم |
|---|---|
| إصلاح دورة حياة تجهيزات الاختبارات الأربعة | **GO للشيفرة الاختبارية**، بتشغيل معزول ومشترك |
| استقلال اختبار الوسائط عن وجود التنفيذي | **GO للشيفرة الاختبارية** |
| خروج `run_all_tests.py` بعد انتهاء الاختبارات في بيئة Windows CI المراجعة | **تحسن مثبت**: لم تعد هناك مهلة انتظار، لكن رمز الخروج `1` بسبب اختبار واجهة غير ناجح |
| نجاح المجموعة الكاملة | **NO-GO**، بقي `TclError` في `CommandPaletteDialog` |
| إغلاق S-01 بالكامل | **CONDITIONAL GO** حتى اختبار إصلاح النافذة أو تحديد قيود البيئة بدليل |
| دمج الفرع، أو PR #1، أو النشر | **NO-GO**؛ لم يُنفذ شيء منها |
| إصدار F-01 المعبأ | **NO-GO**؛ دورة الحزمة التفاعلية لم تُنفذ |

**حدود الدليل:** الاختبارات هنا على `Windows Server 2022` و`Python 3.13.17` داخل `GitHub Actions`، وليست دورة تشغيل تطبيق إنتاجية على `Windows 10`، ولم تُختبر المثبتات القديمة. اختبار `yt-dlp` محاكاة لمسار إضافة مهمة مؤجلة فقط.

## 7. ضوابط الدمج والتراجع

لا تدمج هذا الفرع آليًا، ولا تنقل شيفرة F-01 أو أدوات التشخيص إليه. يمكن إرجاع تعديلات الاختبارات باستخدام `git revert` لالتزامات الفرع من الأحدث إلى الأقدم بعد التحقق من `HEAD`، دون `reset --hard` أو `git clean -fdx`.

**الخطوة التالية الموصى بها:** عزل تدمير `CommandPaletteDialog` مبكرًا في اختبار `test_regression` (أو قيود بيئة العرض التفاعلي) باختبار إعادة إنتاج مستقل، دون تعديل واجهة المنتج أو تجاهل فشل الاختبار حتى يثبت السبب.
