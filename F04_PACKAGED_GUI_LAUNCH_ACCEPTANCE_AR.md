# F04_PACKAGED_GUI_LAUNCH_ACCEPTANCE_AR

## نتيجة تنفيذ F-04 الجزئية — 2026-11-04

**بوابة فتح وإغلاق ملف المثبت المعبأ: `PASS`.**

**بوابة تثبيت/ترقية/إزالة تفاعلية مكتملة: `NOT TESTED`.**

**بوابة إصدار ملف المثبت: `NO-GO`.**

### الدليل التنفيذي الذي تمت مراجعته

- المصدر: `verification/f04-packaged-gui-launch-20261104`، التزام تشغيل `562403e5a86988a4d799871e2a06d84bd274424c`.
- تشغيل `Windows Server 2022` الفعلي: [GitHub Actions #41907102127](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41907102127).
- [ملفات نتيجة JSON المحفوظة](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41907102127/artifacts/13360662247)، معرّف Artifact المؤكد من تشغيل GitHub.
- التبعيات: `Python 3.13.17` و`PyInstaller` المقيّد في `requirements.txt`.
- أُعيد بناء `NegmLoading.exe` و`NegmLoading-Setup.exe` من الشيفرة نفسها، ثم أُعيد إنشاء `payload.zip` من الملف التنفيذي الجديد؛ لم يُستخدم `dist/` التاريخي بوصفه مصدرًا.

### نتائج البناء وفحوص الحمولة

نجح اختبار `test_legacy_migration` (عدد `14` حالة) قبل إطلاق المثبت. ثم اجتاز فاحص `F-02` **عشر حالات `PASS`** منها تطابق الحمولة داخل `Setup.exe` والملفات المبنية حديثًا، وفحوص التثبيت والترقية والإزالة باستخدام محرك `Python` ومفاتيح `HKCU` اختبارية فقط.

| الملف | الحجم بالبايت | بصمة `SHA-256` |
|---|---:|---|
| `dist/NegmLoading.exe` | `26,280,898` | `a3407865cfdc073360c054c1be4a84542dab98b91d5f12a6e074e36b8fc0ab12` |
| `dist/NegmLoading-Setup.exe` | `47,038,591` | `a9c3ee98e19d405b62fecdeba98f909fa49c1067acdabdc4e9b6e4d87f5c157a` |
| `payload.zip` داخل المثبت | `27,205,529` | `10ad4f9d23292af0b5ee62fc0d708fedd9c79e002ac5c11104b8e812b87eb5ac` |

أكد الفحص `executable_name_match=true` و`legacy_display_identity_unchanged=true`. أبقى `release_ready=false` لأن تشغيل المعالج وحده لا يكفي للإصدار.

### اختبار تشغيل `Setup.exe` الفعلي

نفذت أداة `.github/scripts/f04_packaged_gui_smoke.py`، بعد التأكد من أنها على عامل `GitHub Actions Windows` مؤقت وليس جهاز المالك، الإجراءات التالية:

1. التحقق **قبل الإطلاق** من عدم وجود مفتاح إزالة `HKCU` الإنتاجي أو مجلد تثبيت افتراضي.
2. إطلاق **`dist/NegmLoading-Setup.exe` المعبأ نفسه** بعملية Windows جديدة، دون تشغيل `installer_engine.py` مباشرة.
3. فحص قائمة نوافذ Win32 المرئية وربطها بالملف التنفيذي **بنفس المسار** عبر `QueryFullProcessImageNameW`، مع انتظار زمني محدد.
4. رصد العنوان الفعلي `Negm Lodaing 1.0.0 - Setup Wizard`، ثم إرسال `WM_CLOSE` إلى نافذة المعالج المطابقة فقط.
5. التحقق من **الخروج الطبيعي بالرمز `0`**، وعدم ظهور مفتاح إزالة أو مجلد تثبيت بعد الإغلاق.

**القيم المسجلة:** `setup_executed=true`، `visible_wizard_found=true`، `clean_close_exit=0`، `clicked_install=false`، `legacy_uninstaller_executed=false`، `no_production_registration_or_install_after_close=true`، `final_registry_absent=true`، `final_install_folder_absent=true`، `result=PASS_GUI_LAUNCH_CLOSE_ONLY`.

**حد الدليل:** التجربة أجريت على عامل `GitHub Actions` مؤقت له واجهة Win32 مرئية. هذا ليس إثباتًا لتجربة واجهة حرة كاملة على `Windows 10/11 VM` مع مراحل التثبيت والترقية والإزالة، ولا يشمل النقر على أي خيار تثبيت أو تشغيل المزيل.

### محاولات الفحص غير الناجحة التي لم تُخفَ

المحاولة [#41906770761](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41906770761) بنيت فيها الحزمة وفحوص الحمولة بنجاح، لكن اختبار `GUI` توقف **قبل إطلاق المثبت** بسبب `ModuleNotFoundError: installer_engine` عند تشغيل أداة الاختبار من `.github/scripts`. صُحح استيراد مسار جذر المستودع داخل أداة الاختبار فقط، دون تعديل شيفرة المنتج. المحاولة التالية [#41907102127](https://github.com/elsayednegm13/Negm-Loading/actions/runs/41907102127) أكدت النجاح الفعلي.

### بوابة قبول التثبيت التفاعلي المتبقية

تظل خطة `F04_WINDOWS_VM_RELEASE_TEST_PLAN_AR.md` المرجع الإجرائي لحالات `VM-03` إلى `VM-12`. لم تُنفذ هذه الحالات، بما فيها التثبيت من المعالج، فحص اختصارات Windows، قيمة بدء التشغيل، الترقية من نسخة حديثة، الإزالة من الواجهة، ومحاكاة وجود النسخة القديمة أثناء اختيار مجلد التثبيت.

**خطر النسخ القديمة لا يزال قائمًا:** قد يشير `UninstallString` القديم إلى `uninstall.cmd` الذي يحوي `rd /s /q`؛ لا يجوز تشغيل ذلك الملف أو مزيلًا تاريخيًا في أي اختبار ترحيل غير معزول. ولا توجد ملكية موثوقة تسمح بتبنّي ملفات نسخ قديمة بلا بيان.

### السلامة ونطاق التغييرات

هذا الفرع أضاف أداة فحص `CI` وملف `Workflow` ووثائق اختبار فقط؛ **لا توجد تعديلات إنتاجية على المثبت أو التطبيق في المرحلة F-04**. لم يُنشأ إصدار أو يرفع `Setup.exe` للتوزيع، ولم يجرِ دمج إلى `main`.

## القرار

**`PACKAGED GUI OPEN/CLOSE GO — EMBEDDED PACKAGE BACKEND GO — F03 OLD-INSTALL REFUSAL TESTS GO — FULL INTERACTIVE VM E2E NOT TESTED — RELEASE NO-GO`.**
