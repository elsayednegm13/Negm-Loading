# F01_CLOSURE_REPORT_AR

## تحديث F01R3

HEAD قبل التصحيح: `abc975f4bc7d6d4382a40d15e59e7cdce3a17497`. الشيفرة المراجعة سابقًا: `d77787dc48974aceca37eed44649a1a503ce9216`. التزام F01R3: `b8758cd67f015179dd22cc771ee48b4819f0cfdb`. الفرع `fix/f01-safe-uninstall`. `main` ما زال `f17f942f0be63ea4564378a2997669a5b5cd4869`. لا دمج ولا نشر.
المقارنة: https://github.com/elsayednegm13/Negm-Loading/compare/main...fix/f01-safe-uninstall
التزام الإصلاح: https://github.com/elsayednegm13/Negm-Loading/commit/b8758cd67f015179dd22cc771ee48b4819f0cfdb
التقرير: https://github.com/elsayednegm13/Negm-Loading/blob/fix/f01-safe-uninstall/F01_CLOSURE_REPORT_AR.md

### العطل

بعد F01R2، فشل حذف اختصار مملوك يضع `$finalFailed` ثم يكمل السكربت فيحذف `negmloading-install-manifest.json` ومرساة HKCU، ثم يخرج 4 مع بقاء `uninstall.cmd` و`negmloading-uninstall.ps1`. إعادة التشغيل لا تجد بيانًا صالحًا مربوطًا بالمرساة، فالاسترداد الآلي ينكسر.

### الإصلاح

في `_POWERSHELL_TEMPLATE`، تنظيف الاختصار (حوالي 1150) وقيمة Run (حوالي 1185) صار يخرج 4 فورًا إذا فشل، قبل نقل البيان أو حذف المرساة. البيان يُنقل جانبًا فقط بعد نجاح التكاملات. إذا فشل حذف المرساة يُعاد البيان إلى اسمه وتبقى السكربتات، والرسالة تقول إن إعادة المحاولة ممكنة. إذا زالت المرساة وبقي ملف البيان، الرسالة تقول صراحة إن إعادة المحاولة الآلية لا تستطيع إثبات الملكية. `safe_uninstall()` حوالي 745 يسحب المرساة قبل حذف ملفات الاسترداد، ويعيد 4 مع الإبقاء على البيان إذا بقيت المرساة.

لا حذف تكراري للجذر، ولا إيقاف لعملية أجنبية.

### إعادة المحاولة

`test_cmd_exit_4_keeps_recovery_and_retry_succeeds` في `f01-evidence/unittest-f01r3.txt`:

- ملف مستخدم خارج الجذر، بصمته قبل التشغيل وبعد الخروج 4 وبعد الخروج 0 لم تتغير.
- بعد قفل الاختصار: خروج 4، والبيان والسكربتان والمفتاح `HKCU\Software\NegmLoadingF01Test\<guid>` موجودة، والملف المملوك زال.
- بعد فك القفل: خروج 0، والاختصار المملوك زال، والمفتاح لم يعد يُفتح.

`test_cmd_readonly_manifest_keeps_anchor_for_retry`: بيان للقراءة فقط يعطي 4 مع بقاء البيان والمرساة، وبعد إزالة السمة تنجح الإعادة.

`test_cmd_anchor_delete_denied_keeps_manifest`: منع حذف مفتاح الاختبار يعطي 4 مع بقاء البيان، والرسالة تتضمن `Retry is possible` ولا تقول إن الإعادة مستحيلة. بعد رفع المنع تنجح الإعادة.

حد الذرية: لا توجد معاملة واحدة تغطي الملف وHKCU. إذا حُذفت المرساة ثم فشل حذف ملف البيان المنقول، تبقى الحالة غير قابلة للإثبات عند إعادة التشغيل، والرسالة تطلب تنظيفًا يدويًا. لا يُوعد بالاسترداد الآلي من كل فشل.

### رموز الخروج

| الرمز | المعنى | ما يُحذف | ما يُحفظ |
|---|---|---|---|
| 0 | الحمولة زالت والتكاملات والبيان والمرساة تحققت | ملفات مملوكة، اختصارات التطبيق، قيمة Run التابعة، البيان، المرساة، ثم `ps1` | ملف مستخدم خارج الجذر؛ `uninstall.cmd` الجاري قد يبقى حتى لا يفسد رمز الخروج |
| 2 | فشل التحقق | لا شيء | كل شيء |
| 3 | إزالة الحمولة ناقصة | الملفات المطابقة فقط | البيان، المرساة، السكربتات، الملفات المعدلة أو غير المعروفة |
| 4 مع بقاء البيان والمرساة | فشل اختصار أو Run أو مرساة أو بيان غير قابل للحذف | الحمولة المطابقة | البيان، المرساة، السكربتات؛ إعادة المحاولة ممكنة |
| 4 بعد زوال المرساة | حذف ملف البيان فشل بعد حذف المرساة | الحمولة والمرساة | ملف بيان متبقٍ والسكربتات؛ الإعادة الآلية لا تثبت الملكية |

### الاختبارات

- `python -m unittest -v test_installer_safety`: 37 اختبارًا، OK، SKIP واحد، خروج العملية **0**، 15.889 ثانية. `f01-evidence/unittest-f01r3.txt`.
- `python -m compileall -q installer_engine.py installer_safety.py test_installer_safety.py`: خروج **0**.
- `python run_all_tests.py`: النص `[SUCCESS]`، 81 اختبارًا، SKIP واحد، 55.362 ثانية. العملية لم تعد. رمز الغلاف بعد الإيقاف **-1**. ليس PASS بخرج 0. استثناء Tk مطلوب، و`ui_*.py` لم تُغيَّر. `f01-evidence/run-all-tests-f01r3.txt`.
- symlink: SKIP. لم تُرفع صلاحيات الجهاز ولم يُغيَّر Developer Mode.
- الحزمة في Sandbox/VM: **NOT TESTED**. SHA-256 للبناء خارج المستودع: `301672efb4815fde031a3ecf6c5d5a9f5d04e8f55af1c7d4c488705d36ef4e84`. `f01-evidence/windows-build-f01r3.txt`.

### الملفات والتراجع

- `installer_safety.py` و`test_installer_safety.py` و`f01-evidence/*f01r3*` وهذا التقرير.
- `installer_engine.py` لم يحتج تعديلًا.
- التراجع: `git revert` لالتزام F01R3، أو `git checkout abc975f4bc7d6d4382a40d15e59e7cdce3a17497 -- installer_safety.py test_installer_safety.py`. لا `reset --hard`.

### موانع المراجعة

| المانع | الأصل | الاختبار | المكان | المتبقي | ما يحتاجه المراجع |
|---|---|---|---|---|---|
| استرداد الخروج 4 | حذف البيان والمرساة قبل التأكد من التكاملات | `test_cmd_exit_4_keeps_recovery_and_retry_succeeds` | PowerShell حوالي 1150–1236 و`safe_uninstall` حوالي 745 | فشل حذف ملف البيان بعد زوال المرساة غير قابل للإعادة الآلية | مراجعة الترتيب والسجل |
| قتل عملية أجنبية | أُغلق في F01R2 | `test_cmd_does_not_kill_foreign_process_inside_root` | القالب نفسه | لم يُختبر إيقاف نسخة المستخدم الحقيقية | لا شيء جديد |
| HKCU | نفس المستخدم يكتب البيان والمرساة معًا | موثّق لا يُختبر كإغلاق | `write_install_anchor` | ليس HMAC | قرار بقبول الحد أو جذر ثقة خارجي |
| `uninstall.cmd` القديم | نسخ منشورة قبل الإصلاح | غير قابل للإصلاح من المستودع | — | `rd /s /q` يبقى حتى إعادة التثبيت | قبول أو أداة ترحيل لاحقة |
| اسم التنفيذي | `NegmLoading.exe` مقابل `Negm Lodaing.exe` | مؤجل | F-02 | لم يُمس | لا يُغلق هنا |
| حزمة Sandbox | البيئة غير موجودة | NOT TESTED | — | لا تشغيل فعلي | Sandbox أو VM |

### القرار

**NO-GO لإغلاق F-01.** خلل الاسترداد بعد الخروج 4 أُغلق واختُبر على المسار `cmd → PowerShell`، بما في ذلك إعادة المحاولة. الأدلة لا تكفي لإغلاق المرحلة: الحزمة NOT TESTED، وsymlink SKIP، وحد المرساة وحد النسخ القديمة قائمان، ومشغّل المجموعة الكاملة لم يخرج برمز 0.

---



HEAD عند بدء هذا التصحيح: `23d8a73b3591183d48ae4baaf7af274e31556d60`. الفرع `fix/f01-safe-uninstall`. `main` بقي `f17f942f0be63ea4564378a2997669a5b5cd4869`. لا دمج.
التزام F01R2: `d77787dc48974aceca37eed44649a1a503ce9216`.
المقارنة: https://github.com/elsayednegm13/Negm-Loading/compare/main...fix/f01-safe-uninstall
التزام الشيفرة: https://github.com/elsayednegm13/Negm-Loading/commit/d77787dc48974aceca37eed44649a1a503ce9216

### المانع 1 — إنهاء عملية أجنبية

- العطل: `_POWERSHELL_TEMPLATE` كان ينفّذ `Stop-Process` لكل عملية يقع `ExecutablePath` داخل `$Root`.
- الإصلاح: الإيقاف صار مشروطًا باسم `Negm Lodaing.exe` مباشرة تحت الجذر، وبمطابقة SHA-256 لسجل البيان، وبعدم كون المسار نقطة إعادة تحليل. أي عملية أخرى داخل الجذر تبقى، ويُعامل الملف المقفل بمسار الخروج 3.
- الاختبار: `test_cmd_does_not_kill_foreign_process_inside_root`. نُسخت `cmd.exe` إلى `foreign-tool.exe` داخل مجلد مؤقت وشُغّلت، وبقيت حية، وخرج الإزالة 3 لأن الملف الأجنبي غير مملوك. السجل: `f01-evidence/unittest-f01r2.txt`.
- المتبقي: لا يُختبر إيقاف `Negm Lodaing.exe` الحقيقي. العملية الاصطناعية ليست عملية مستخدم.

### المانع 2 — نجاح كاذب بعد التنظيف النهائي

- العطل: أوامر حذف السكربت والمجلد والسجل والاختصار كانت تُبتلع أخطاؤها ثم يُعاد 0.
- الإصلاح: رمز `4` (`EXIT_FINAL`) يعني أن الحمولة أزيلت لكن التنظيف النهائي لم يُتحقق منه. الاختصار الذي لا يُقرأ أو لا يُحذف، والبيان الباقي، والمرساة الباقية، تمنع 0. `uninstall.cmd` يتحقق من زوال `negmloading-uninstall.ps1` قبل إعلان النجاح، ولا يحذف نفسه ثم يكمل لأن ذلك يعيد «The batch file cannot be found». لا يوجد `rd /s` ولا `rmdir /s`.
- الاختبار: `test_cmd_final_cleanup_failure_is_not_success` قفل اختصارًا مملوكًا. الخروج كان 4 وليس 0، والحمولة زالت، والاختصار و`ps1` و`cmd` بقوا. السجل نفسه أعلاه.
- المتبقي: ملف `uninstall.cmd` الجاري قد يبقى داخل جذر أنشأه المثبت، لأن حذفه من العملية نفسها يفسد رمز الخروج. ذلك ليس إعلانًا بأن المجلد زال.

### أدلة هذه الجولة

- `python -m unittest -v test_installer_safety`: 34 اختبارًا، OK، SKIP واحد، خروج العملية 0، 10.112 ثانية. `f01-evidence/unittest-f01r2.txt` و`unittest-f01r2.meta.txt`.
- `python run_all_tests.py`: النص `[SUCCESS]`، 78 اختبارًا، SKIP واحد، 54.438 ثانية. العملية لم تعد، فأُوقفت، ورمز الغلاف `-1`. هذا عيب Tk خارج F-01. لم تُعدَّل `ui_*.py`. المطلوب استثناء رسمي لهذا المشغّل. `f01-evidence/run-all-tests-f01r2.txt` و`run-all-tests-f01r2.meta.txt`.
- symlink: SKIP. `os.symlink` رفع خطأ صلاحية/Developer Mode. ليس PASS. junction ما زال PASS.
- النسخة المعبأة: بُنيت خارج المستودع. SHA-256 `e9179b469225380161da295b41d853129c61e38f3b4905759f40da8b95421620`. الحجم 19810142. التشغيل في Sandbox/VM: **NOT TESTED**. `WindowsSandbox.exe` غير موجود، وفحص الميزة احتاج صلاحية إدارية. لم يُشغَّل المعالج. `f01-evidence/windows-build-f01r2.txt`.
- حد HKCU: المرساة ترفض تعديل البيان وحده. لا تحمي من عملية بنفس صلاحيات المستخدم تعيد كتابة البيان والمرساة معًا. لا يُستخدم HMAC بمفتاح محلي. النسخ القديمة بلا بيان، أو بيان `2f532aa` بلا مرساة، تخرج 2 ولا تحذف. `uninstall.cmd` القديم على الأجهزة يبقى فيه `rd /s /q` حتى إعادة التثبيت.

### الملفات والتراجع

- `installer_safety.py`: حصر إيقاف العملية، ورمز 4، والتحقق قبل إعلان النجاح.
- `test_installer_safety.py`: اختبار العملية الأجنبية واختبار فشل التنظيف النهائي.
- `f01-evidence/unittest-f01r2.txt` و`run-all-tests-f01r2.txt` و`windows-build-f01r2.txt`: سجلات هذه الجولة.
- `F01_CLOSURE_REPORT_AR.md`: هذا التقرير.
- لم تُعدَّل `installer_engine.py` ولا ملفات F-02 أو الواجهة.
- التراجع من غير `reset --hard` ومن غير حذف بيانات مستخدم: `git revert` لالتزامات F01R2 على الفرع فقط، أو `git checkout 23d8a73b3591183d48ae4baaf7af274e31556d60 -- installer_safety.py test_installer_safety.py`.

### القرار بعد F01R2

**NO-GO لإغلاق F-01.** المانعان المراجعان أُغلقا بالاختبار، لكن اعتماد الإغلاق ما زال ممنوعًا: اختبار الحزمة NOT TESTED، وsymlink SKIP، وحد المرساة كما هو.

---

قالب `F01_CLOSURE_REPORT_TEMPLATE_AR.md` غير موجود في المستودع ولا في رسالة التنفيذ. هذا التقرير يتبع الأقسام العشرة المطلوبة في أمر F-01R.

## 1. المرجع

- المستودع: https://github.com/elsayednegm13/Negm-Loading
- الفرع: `fix/f01-safe-uninstall`
- أساس المرحلة: `2f532aa653b71b92437434a3dc37528af9ba3c92` (Use safe uninstall artifacts)
- HEAD عند بدء F-01R: `2f532aa653b71b92437434a3dc37528af9ba3c92`
- التزام الشيفرة والأدلة: `9de8845534eb1fc46cde00ffdbc37421ba7f3458`
- التزام التقرير الأول: `3c53ec280152b77cd64d64daed17faeb3bdc8a91`
- لا يوجد PR، ولم يُنفَّذ merge إلى `main`.
- دُفع `2f532aa..3c53ec2` إلى `origin/fix/f01-safe-uninstall`، ثم أُضيف سطر التوثيق هذا بعده.
- المقارنة: https://github.com/elsayednegm13/Negm-Loading/compare/main...fix/f01-safe-uninstall
- التزام الشيفرة: https://github.com/elsayednegm13/Negm-Loading/commit/9de8845534eb1fc46cde00ffdbc37421ba7f3458
- `main` لم يُعدَّل. `stash@{0}` الخاص بـ GitHub Desktop تُرك كما هو ولم يُطبَّق.

## 2. المعالجات

### F01R-01 — الإبقاء على وسيلة الإزالة عند الفشل

- العطل المثبت قبل التعديل: `generate_uninstall_cmd()` كان يشغّل PowerShell ثم يحذف `negmloading-uninstall.ps1` و`uninstall.cmd` بلا النظر إلى `ERRORLEVEL`. سكربت PowerShell كان يحذف البيان حتى عند الخروج 3.
- دليل ما قبل الإصلاح، على مجلد مؤقت حُذف بعده: `USER_EXISTS False`، و`CMD_DELETES_PS1_UNCONDITIONALLY True`.
- التعديل: `generate_uninstall_cmd()` في `installer_safety.py` حوالي السطر 834، وقالب `_CMD_TEMPLATE` حوالي السطر 807. الحذف يحدث فقط داخل `if "%EC%"=="0"`. عند أي رمز آخر تُطبع `MANUAL CLEANUP REQUIRED` وتبقى السكربتات.
- `safe_uninstall()` حوالي السطر 635 وسكربت PowerShell من السطر 882 لا يحذفان البيان ولا سكربتات الاسترداد إذا فشل التحقق أو بقيت ملفات مملوكة أو ملفات مستخدم.
- رموز الخروج المصرح بها:
  - `0`: أزيلت ملفات الحمولة ولم تبقَ ملفات غير مملوكة. تُسحب أدوات الاسترداد بعد ذلك فقط.
  - `2`: فشل التحقق. لا يُحذف شيء. تبقى أدوات الاسترداد.
  - `3`: إزالة ناقصة. يبقى البيان والسكربتات ومرساة السجل. لا تُمس الاختصارات.
  - أي رمز آخر من PowerShell: لا تُحذف أدوات الاسترداد.
- الاختبارات: `test_cmd_missing_helper_exits_2_and_keeps_inventory`، `test_cmd_corrupt_manifest_keeps_recovery`، `test_stub_powershell_failure_does_not_delete_helper`، `test_cmd_locked_file_keeps_recovery`، `test_cmd_modified_file_and_repeat_keep_recovery`.
- تنازل: عند النجاح الكامل يحذف `uninstall.cmd` نفسه بعد الانتقال إلى `%TEMP%`. هذا لا يحدث عند الفشل.

### F01R-02 — الاختصارات وHKCU

- العطل: `uninstall.cmd` كان ينفّذ `del` لاختصارات سطح المكتب وقائمة ابدأ، و`reg delete` لمفتاح الإزالة ومفتاح Run، و`taskkill /IM`، قبل فحص البيان.
- التعديل: هذه الأوامر حُذفت من `uninstall.cmd`. التنظيف صار داخل PowerShell وبعد اكتمال إزالة الحمولة فقط. الاختصار يُحذف فقط إذا كان `TargetPath` داخل جذر هذا التثبيت. قيمة Run تُحذف فقط إذا كان مسارها داخل الجذر. مفتاح المرساة يُحذف عند الخروج 0 فقط إذا طابق `InstallLocation` هذا الجذر.
- عند غياب البيان أو تلفه: خروج 2 ونص `MANUAL CLEANUP REQUIRED`، ومن دون حذف ملفات أو اختصارات أو مفاتيح.
- الاختبارات على مجلدات مؤقتة ومفتاح `HKCU\Software\NegmLoadingF01Test\<guid>` فقط، وليس مفتاح الإنتاج `Software\Microsoft\Windows\CurrentVersion\Uninstall\Negm Lodaing`. قبل التشغيل كان مفتاح الإنتاج غائبًا (`PROD_KEY_ABSENT`). لم تُستخدم اختصارات سطح المكتب الحقيقية.
- `test_cmd_success_preserves_outside_data_and_foreign_records`: اختصار هدفه خارج الجذر بقي، واختصار هدفه داخل الجذر زال بعد الخروج 0، ومفتاح أجنبي بعلامة `other-install` بقي.
- `test_cmd_modified_file_and_repeat_keep_recovery`: عند الخروج 3 بقي الاختصار.
- تنازل: لم تُشغَّل إزالة على تثبيت مستخدم حقيقي، ولا داخل Windows Sandbox أو VM.

### F01R-03 — SHA-256 ليس دليل ملكية

- العطل المثبت: إضافة ملف مستخدم إلى البيان مع هاشه الصحيح كانت كافية لحذفه. الدليل قبل الإصلاح: `USER_EXISTS False` و`user-file.txt` ضمن `RESULT_DELETED`.
- نموذج الثقة: مجلد التثبيت قابل للكتابة من المستخدم الذي ثبّت البرنامج. أي سر أو HMAC بجانب البيان تحت نفس الصلاحية قابل للتزوير. لذلك لا يُستخدم HMAC بمفتاح مخزّن في المجلد.
- ما نُفّذ: `write_install_anchor()` حوالي السطر 488 يكتب في HKCU بصمة قانونية للبيان (`manifest_fingerprint()` السطر 465) مع مسار التثبيت. `verify_install_anchor()` السطر 549 و`Test-Anchor` في PowerShell يرفضان الحذف إذا اختلفت البصمة أو المسار أو غابت المرساة.
- تعديل البيان وحده، بما فيه إضافة ملف مستخدم وهاشه الصحيح، يفشل مغلقًا: خروج 2، ولا يُحذف الملف المملوك الأصلي ولا ملف المستخدم. الاختبار على المسار الفعلي: `test_cmd_spoofed_user_file_hash_deletes_nothing`.
- ما لم يُغلق: عملية تعمل بنفس المستخدم وتقدر أن تعيد كتابة البيان وHKCU معًا تستطيع صنع مرساة جديدة. إغلاق ذلك يحتاج مفتاح توقيع بائع غير موجود في المستودع، أو مالكًا أعلى من المستخدم عبر صلاحية إدارية. كلاهما خارج F-01. هذا ليس إصلاحًا كاملًا للملكية.

### F01R-04 — تنظيف Git

- الالتزام `2f532aa` أضاف 18 ملف `pyc` تحت `__pycache__/` في جذر المستودع.
- أُزيلت هذه المسارات الثمانية عشر من الفهرس بـ `git rm --cached` فقط. النسخ المحلية بقيت (`local pyc kept`).
- أُضيف `.gitignore` بالقاعدتين `__pycache__/` و`*.py[cod]` فقط.
- `git diff --check` بعد ذلك: خروج 0 ومن دون تحذيرات.
- ما زال `git ls-files '*__pycache__*' '*.pyc'` يُظهر 10 ملفات أقدم تحت `.agents/` لم تكن ضمن الثمانية عشر. لم تُحذف لأنها خارج نطاق المقارنة المحددة. القائمة في `f01-evidence/git-ls-files-pyc.txt`.

## 3. النطاق

| المسار | التغيير | السبب |
|---|---|---|
| `installer_safety.py` | تعديل | منطق المرساة، رموز الخروج، الإبقاء على الاسترداد، وقوالب cmd/PowerShell |
| `test_installer_safety.py` | تعديل | اختبارات الانحدار وسلسلة `uninstall.cmd` |
| `.gitignore` | إضافة | تجاهل `__pycache__/` و`*.py[cod]` |
| `__pycache__/*.pyc` الثمانية عشر | حذف من الفهرس فقط | F01R-04 |
| `f01-evidence/` | إضافة | سجلات الاختبار والأوامر |
| `F01_CLOSURE_REPORT_AR.md` | إضافة | تقرير الإغلاق المطلوب |
| `installer_engine.py` | لم يُعدَّل | ما زال يستدعي `write_uninstall_artifacts()`، والمرساة تُكتب من هناك |
| `run_all_tests.py` | لم يُعدَّل | الاختبارات في وحدة مسجّلة مسبقًا |
| `nexus_engine.py` و`nexus_stream_manager.py` و`ui_*.py` و`browser_extension/` و`*.spec` و`requirements.txt` و`dist/` و`payload.zip` | لم تُعدَّل | خارج النطاق |

`git diff HEAD --stat` قبل إضافة التقرير وأدلة البناء الأخيرة:

```
 __pycache__/installer_engine.cpython-313.pyc      | Bin 28649 -> 0 bytes
 __pycache__/installer_safety.cpython-313.pyc      | Bin 39627 -> 0 bytes
 __pycache__/nexus_engine.cpython-313.pyc          | Bin 296459 -> 0 bytes
 __pycache__/nexus_stream_manager.cpython-313.pyc  | Bin 164728 -> 0 bytes
 __pycache__/test_analytics.cpython-313.pyc        | Bin 14284 -> 0 bytes
 __pycache__/test_installer_safety.cpython-313.pyc | Bin 38771 -> 0 bytes
 __pycache__/test_link_recovery.cpython-313.pyc    | Bin 12071 -> 0 bytes
 __pycache__/test_media_grabber.cpython-313.pyc    | Bin 9186 -> 0 bytes
 __pycache__/test_proxy_vault.cpython-313.pyc      | Bin 10830 -> 0 bytes
 __pycache__/test_queue_system.cpython-313.pyc     | Bin 7599 -> 0 bytes
 __pycache__/test_regression.cpython-313.pyc       | Bin 8907 -> 0 bytes
 __pycache__/test_site_grabber.cpython-313.pyc     | Bin 10616 -> 0 bytes
 __pycache__/test_stress_profiling.cpython-313.pyc | Bin 7251 -> 0 bytes
 __pycache__/test_web_remote.cpython-313.pyc       | Bin 14667 -> 0 bytes
 __pycache__/ui_components.cpython-313.pyc         | Bin 89622 -> 0 bytes
 __pycache__/ui_dialogs.cpython-313.pyc            | Bin 342557 -> 0 bytes
 __pycache__/ui_table.cpython-313.pyc              | Bin 53889 -> 0 bytes
 __pycache__/ui_theme.cpython-313.pyc              | Bin 53065 -> 0 bytes
 installer_safety.py                               | 631 ++++++++++++++++++----
 test_installer_safety.py                          | 332 +++++++++++-
 20 files changed, 818 insertions(+), 145 deletions(-)
```

`git diff --check`: خروج 0. الملف `f01-evidence/git-diff-check.txt` فارغ لأن الأمر لم يطبع تحذيرات.

## 4. الاختبارات

البيئة: Windows 10.0.26300، Python 3.13.16، Windows PowerShell 5.1.26100.9818. ليست Windows Sandbox وليست VM.

| الأمر | النتيجة | المدة | السجل |
|---|---|---|---|
| `python -m unittest -v test_installer_safety` | 32 اختبارًا، OK، SKIP واحد، خروج الغلاف 0 | 7.889 ثانية حسب unittest، و8.24 ثانية حتى إغلاق العملية | `f01-evidence/unittest-installer-safety.txt` |
| `python run_all_tests.py` | 76 اختبارًا، OK، SKIP واحد، نص `[SUCCESS]` | 51.091 ثانية حسب المشغّل | `f01-evidence/run-all-tests.txt` |
| `python -m compileall -q installer_engine.py installer_safety.py test_installer_safety.py` | خروج 0 | أقل من ثانية | `f01-evidence/compileall.meta.txt` |
| `git diff --check` | خروج 0 | — | `f01-evidence/git-diff-check.txt` |

عملية `run_all_tests.py` طبعت النجاح ثم بقيت معلقة، فأُوقفت بـ `Stop-Process` بعد اكتمال السجل. رمز خروج الغلاف غير مُلتقط. النتيجة المعتمدة هي نص السجل لا رمز عملية أُوقفت بعد الطباعة. لم تُعد المجموعة لإخفاء فشل.

`test_proxy_crud_and_active_selection` نجح داخل هذا التشغيل الكامل. لا يوجد فشل جديد يُعاد إنتاجه في هذا السجل.

SKIP الوحيد: `test_symlink_file_redirection_is_preserved`. السبب: `os.symlink` رفع `OSError` لأن إنشاء symlink للملف يحتاج صلاحية أو Developer Mode. هذا SKIP وليس PASS. اختبار junction بعد التثبيت نجح.

## 5. الحالات العدائية

المسار الفعلي في الاختبارات هو `cmd.exe /c uninstall.cmd` ثم PowerShell، على مجلد اسمه `Negm Lodaing Install`، إلا حيث ذُكر Python.

| الحالة | النتيجة | ملف المستخدم | البيان وأدوات الاسترداد | اختصار/سجل |
|---|---|---|---|---|
| بيان مفقود مع غياب `ps1` | خروج 2 | بقي | `uninstall.cmd` والبيان بقيا، و`ps1` كان محذوفًا عمدًا قبل التشغيل | لم تُمس |
| بيان تالف `{not-json` | خروج 2 | بقي | `ps1` و`cmd` بقيا | لم تُمس |
| بيان مُعدَّل بملف مستخدم وهاشه الصحيح | خروج 2 عبر cmd | بقي بايتًا ببايت، وكذلك ملف خارج الجذر | البيان و`ps1` و`cmd` والملف المملوك الأصلي بقوا | لم تُمس |
| ملف مملوك مُعدَّل | خروج 3، ثم إعادة تشغيل بخروج 3 | بقي | البيان و`ps1` و`cmd` بقوا؛ الملف المطابق الآخر زال | اختصار الاختبار بقي |
| ملف مقفول حصريًا | خروج 3 | الملف المقفل بقي | البيان و`ps1` و`cmd` بقوا | لم تُمس |
| فشل PowerShell قبل العمل (`exit 2` مزروع) | خروج 2 | بقي، والملف المملوك بقي | `ps1` و`cmd` بقيا | لم تُمس |
| نجاح كامل | خروج 0 | لا يوجد ملف مستخدم في هذه الحالة؛ الملف خارج الجذر بقي | أدوات الاسترداد سُحبت بعد النجاح | اختصار الهدف الداخلي زال، والخارجي بقي، والمفتاح الأجنبي بقي |
| Junction استُبدل به مجلد مملوك بعد التثبيت | خروج 3 عبر Python | الهدف خارج الجذر بقي | البيان و`ps1` بقيا | لم يُحذف الهدف |
| Symlink لملف | SKIP | لم يُختبر | لم يُختبر | لم يُختبر |

## 6. سلسلة Windows والبناء

- `uninstall.cmd` → PowerShell نُفّذ على هذا الجهاز داخل مجلدات `%TEMP%` ومفاتيح اختبار، وليس داخل Sandbox أو VM، وليس على مجلد تثبيت حقيقي.
- مفتاح الإنتاج كان غائبًا قبل الاختبارات.
- `NegmLoading-Setup.exe` بُني من نسخة الشيفرة في مجلد خارج المستودع: `C:\Users\NEGM\AppData\Local\Temp\negm-f01-setup-build\dist\NegmLoading-Setup.exe`.
- الأمر: `.venv\Scripts\python.exe -m PyInstaller --noconfirm --clean --distpath dist --workpath build NegmLoading-Setup.spec` مع PyInstaller 6.22.3. خروج البناء 0 خلال 27.14 ثانية.
- SHA-256: `fd1e74de939492ddcbaf45ccc1bbdbc144fd26316feeaa5ede3a7edb46a2eb8e`
- الحجم: 19809972 بايت.
- `installer_safety.py` دخل الأرشيف حسب `PYZ-00.toc`.
- `payload.zip` الاصطناعي أُنشئ في مجلد البناء فقط ويحتوي عضوًا وهميًا اسمه `NegmLoading.exe`. لم يُستخدم `dist\NegmLoading.exe` القديم ولم يُضف ناتج البناء إلى Git.
- معالج التثبيت الرسومي لم يُشغَّل. تشغيله كان سيكتب تثبيتًا حقيقيًا. لذلك لا يوجد اختبار تثبيت/إزالة للحزمة على نظام معزول.
- اختلاف `NegmLoading.exe` و`Negm Lodaing.exe` لم يُعالج. يبقى حاجز F-02.

## 7. التوافق والبيانات

- تثبيت قديم بلا بيان: الإزالة تخرج 2 ولا تحذف الملفات ولا تخمّن الملكية من الاسم. الرسالة `MANUAL CLEANUP REQUIRED`.
- تثبيت `2f532aa` الذي يملك بيانًا بلا مرساة HKCU: الإزالة الجديدة تخرج 2 ولا تحذف. يلزم تنظيف يدوي أو إعادة تثبيت تنشئ المرساة.
- مجلد مشترك فيه ملف مستخدم: ملف المستخدم يبقى. الجذر لا يُحذف إذا لم يكن البرنامج هو من أنشأه (`test_shared_root_is_not_removed_after_full_payload_removal`).
- انقطاع قبل كتابة البيان والمرساة: الملفات تبقى، وإعادة التثبيت على مجلد غير فارغ بلا بيان موثوق تُرفض.
- إعادة المحاولة بعد خروج 3 تستخدم البيان والمرساة نفسيهما. الملفات المحذوفة سابقًا تُحسب مفقودة. الملفات المعدلة تبقى.

نسخ `uninstall.cmd` القديمة الموجودة أصلًا على أجهزة المستخدمين ما زالت تحتوي `rd /s /q` إلى أن يُعاد تثبيت البرنامج. هذا المستودع لا يعدّل تثبيتًا قائمًا.

## 8. المخاطر

- P0 لم يُغلق بالكامل: تزوير البيان وHKCU معًا من نفس المستخدم ما زال يمكن أن يوسّع قائمة الحذف. خارج نطاق F-01 بلا مفتاح توقيع.
- P0 قائم على الأجهزة التي ما زال عليها `uninstall.cmd` القديم.
- P1: لا يوجد اختبار Sandbox/VM، ولا تشغيل لمعالج التثبيت المعبأ.
- P1: اختبار symlink للملف SKIP.
- P2: 10 ملفات `pyc` قديمة تحت `.agents/` ما زالت متتبعة.
- P2 مؤجّل إلى F-02: اسم `Negm Lodaing.exe` مقابل `NegmLoading.exe`. لم يُغيَّر هنا.
- ما أُغلق بالاختبار: الحذف التكراري للجذر، حذف أدوات الاسترداد عند الفشل، لمس الاختصارات والسجل قبل النجاح، وتعديل البيان وحده.

## 9. القرار

**NO-GO لإغلاق F-01، بعد F01R2 أيضًا.**

مانعا المراجعة (قتل عملية أجنبية، وخروج 0 رغم فشل التنظيف النهائي) أُغلقا واختُبرا. الإغلاق الكامل ما زال ممنوعًا لأن تشغيل الحزمة في Sandbox/VM هو NOT TESTED، واختبار symlink للملف SKIP، ومرساة HKCU لا تصمد أمام إعادة كتابة متزامنة من نفس المستخدم.

ما يمكن مراجعته ودمجه لاحقًا كتحسين أمان، من دون اعتبار المرحلة مغلقة: F01R-01 وF01R-02 وF01R-04، ورفض تعديل البيان غير المربوط بالمرساة. القرار النهائي للمراجع. لم يُنفَّذ merge ولم يُنشر إصدار.

## 10. ما يحتاجه المراجع لإغلاق F-01

موجود ويمكن فتحه من الفرع أو شجرة العمل:

- الشيفرة: `installer_safety.py`، `test_installer_safety.py`، `.gitignore`
- السجلات: `f01-evidence/unittest-installer-safety.txt`، `f01-evidence/run-all-tests.txt`، `f01-evidence/windows-build.txt`، `f01-evidence/git-diff-stat.txt`، `f01-evidence/git-ls-files-pyc.txt`
- بناء خارج المستودع وبصمته في القسم 6. الملف نفسه ليس في Git.

ناقص قبل أي GO:

- اختبار symlink لملف، أو بيئة Developer Mode تُظهر PASS لا SKIP.
- تشغيل `NegmLoading-Setup.exe` المبني من هذا HEAD داخل Sandbox أو VM، مع ملفات مستخدم اصطناعية، ومن دون استخدام `dist/` القديم.
- قرار صريح بأن تزوير HKCU مع البيان مقبول كخطر متبقٍ، أو إدخال جذر ثقة خارج نطاق الكتابة نفسه.
- معالجة النسخ القديمة من `uninstall.cmd` على الأجهزة، أو قبول أنها تبقى خطرة حتى إعادة التثبيت.

لا يُطلب من المراجع إعادة لصق النتائج الموجودة في الجداول أعلاه.
