# F01_FINAL_CLOSURE_AUDIT_AR

فحص سلامة إعادة التثبيت بعد `fde0e7087270d7d43cbb813aac4051d9ead7df95`. المرحلة لم تُغلق. لا دمج ولا نشر، و`main` بقي `f17f942f0be63ea4564378a2997669a5b5cd4869`.

## الهدف والنطاق

منع إعادة التثبيت من استبدال ملف غير مملوك أو ملف مملوك تغيّر، خصوصًا `uninstall.cmd` و`negmloading-uninstall.ps1` وملفات البيان المؤقتة. الفحص المطلوب يحدث قبل أول كتابة. F-02 ومدير التنزيل خارج النطاق.

## ما ثَبت قبل التعديل

شيفرة `assess_destination` كانت تفحص مسارات الحمولة فقط. `write_uninstall_artifacts` كانت تفتح السكربتين بوضع الكتابة، و`write_manifest` كانت تكتب الاسم الثابت `negmloading-install-manifest.json.tmp` ثم `os.replace`.

أُعيد الإنتاج في مجلد مؤقت قبل التعديل، والسجل `f01-evidence/f01-reinstall-repro-before.txt`:

| الملف | قبل | بعد الاستدعاء | الحكم |
|---|---|---|---|
| `uninstall.cmd` وفيه سطر مستخدم | `99e479eeac081fd63b36d00be4457e6fc8aed3080c5949f79fcb28951bf589fb` | `e0609716ac34cb80c815efe8d6b4f65da75d7e01dee3b8f31845507e79533754` | استُبدل |
| `negmloading-uninstall.ps1` | `3a16d44d7e721ac84cab13646d293fe01625beda6528b01485bedd4eaba01ad2` | `66453ab5c7b26128ab1a0298e21df851fcbf0964fef36a0f5db9a23eb29dae36` | استُبدل |
| `negmloading-install-manifest.json.tmp` بمحتوى `FOREIGN TMP` | `b09841197b3b2d79cb46bbe495bfdb1e78cf9ba5a912004b015450aecd5c9109` | ABSENT | مُحي |
| ملف المستخدم و`.retiring` | بلا تغيير | بلا تغيير | لم يمسهما هذا المسار |

`assess_destination` أعاد ALLOW ثم نجحت الكتابة. هذا عطل فقد بيانات، لا فرضية.

بعد الإصلاح أعاد السكربت نفسه REFUSE ولم تتغير أي بصمة: `f01-evidence/f01-reinstall-repro-after.txt`. سبب الرفض الظاهر هناك هو ملف `.tmp` لأنه يُفحص قبل السكربت المعدّل. اختبارا A وB يثبتان رفض السكربت وحده.

## القرار التصميمي

فحص واحد، `assess_destination`، صار يشمل الحمولة و`uninstall.cmd` و`negmloading-uninstall.ps1`. ملف `.tmp` أو `.retiring` بهذا الاسم الثابت يوقف التثبيت ولا يُحذف. الاستبدال اللاحق يستخدم إنشاءً حصريًا أو ملفًا مؤقتًا فريدًا ثم `os.replace` بعد إعادة مطابقة البصمة. `prepare_and_copy_payload` هو المسار الذي يستدعيه معالج التثبيت قبل النسخ، ويعيد لقطة ملفات الكتابة إذا فشلت خطوة قبل تثبيت المرساة.

لم تُبنَ معاملة واحدة بين الملفات وHKCU. إذا قُطعت العملية بعد نجاح المرساة، التثبيت المتسق يبقى قابلًا للإزالة. إذا فشل تثبيت المرساة، الدالة تعيد سكربتات الإزالة والبيان، والمعالج يعيد لقطة الحمولة، فيعود جذر الاختبار إلى بايتاته السابقة. نافذة TOCTOU بين إعادة قراءة البصمة و`os.replace` تبقى، وكذلك قدرة المستخدم نفسه على كتابة البيان والمرساة معًا.

## الملفات

| الملف | السبب |
|---|---|
| `installer_safety.py` | الفحص المسبق، الكتابة الحصرية، رفض الاسم المؤقت الثابت، استعادة عند فشل المرساة، اسم `.retiring` فريد في PowerShell حتى لا يُستبدل ملف أجنبي |
| `installer_engine.py` | `prepare_and_copy_payload` قبل النسخ، وعدم إعلان النجاح إذا فشل المسار، ورفض مسار اختصار فيه اقتباس أو سطر جديد |
| `test_installer_safety.py` | حالات A–K |
| `f01-evidence/f01-reinstall-repro-before.txt` | إعادة الإنتاج قبل الإصلاح |
| `f01-evidence/f01-reinstall-repro-after.txt` | نفس السكربت بعد الإصلاح |
| `f01-evidence/unittest-f01-final.txt` | مجموعة السلامة |
| `f01-evidence/run-all-tests-f01-final.txt` | المجموعة الكاملة |
| `f01-evidence/f01-isolated-vm-commands.txt` | أوامر VM لم تُنفَّذ |

`installer_engine.py` تغيّر لأن معالج التثبيت كان يستدعي الفحص الناقص ثم النسخ. بدون ذلك يبقى العطل على مسار المنتج.

## مصفوفة القبول

| الحالة | الحكم | الدليل |
|---|---|---|
| A سكربت cmd معدّل | **PASS** | `test_a_modified_cmd_blocks_reinstall_before_write` |
| B سكربت ps1 معدّل | **PASS** | `test_b_modified_ps1_blocks_reinstall_before_write` |
| C `.tmp` و`.retiring` أجنبيان | **PASS** | `test_c_foreign_temp_and_retiring_are_not_replaced` |
| D ملف إزالة غير مملوك أو مجلد بلا بيان | **PASS** | `test_d_unowned_or_untrusted_uninstaller_is_not_replaced` |
| E ترقية مطابقة ثم إزالة | **PASS** | `test_e_matching_upgrade_then_uninstalls`، خروج 0 |
| F فشل مرساة بعد النسخ ثم إعادة | **PASS** | `test_f_anchor_failure_restores_files_and_retry_works` |
| G بيان تالف وjunction | **PASS** | `test_g_bad_manifest_anchor_and_reparse_stop` |
| H اختصار | **PASS** | الاختبارات السابقة في `TestIntegrationOwnership` و`TestWindowsUninstallChain`، وأُعيد تشغيلها في هذه المجموعة |
| I مسافات و`!` و`&` و`()` و`'` وUnicode | **PASS** | `test_i_special_characters_round_trip` و`test_cmd_special_characters_in_install_path` |
| J ملفات مستخدم وقفل وعملية أجنبية | **PASS** | `test_f` للملف الداخلي، و`test_cmd_locked_file_keeps_recovery`، و`test_cmd_does_not_kill_foreign_process_inside_root`، و`test_cmd_exit_4_keeps_recovery_and_retry_succeeds` |
| K الفحص قبل النسخ من مسار المحرك | **PASS** | `test_k_engine_preflight_runs_before_copy` |

اقتباس داخل مسار اختصار يُرفض قبل تشغيل VBS: `test_quote_in_shortcut_path_is_not_executed`.

## البوابات

| الأمر | الحكم | رمز الخروج |
|---|---|---|
| `python -m compileall -q installer_engine.py installer_safety.py test_installer_safety.py` | **PASS** | 0 |
| `python -m unittest -v test_installer_safety` | **PASS** | 0. 58 اختبارًا، SKIP واحد، 43.258 ثانية. `f01-evidence/unittest-f01-final.txt` و`unittest-f01-final.meta.txt` (`EXIT=0`, `ELAPSED_SEC=43.65`) |
| `python run_all_tests.py` | **BLOCKED/STABILITY** | النص `[SUCCESS]`، 102 اختبارًا، 79.438 ثانية، SKIP واحد. العملية لم تخرج. PID `24988` فقط، أبوه غلاف هذا التشغيل، ومعه `_tkinter.pyd` و14 خيطًا. رمز الغلاف **-1** والمضيف `4294967295`. `run-all-tests-f01-final.meta.txt`: `EXIT=-1`, `ELAPSED_SEC=170.74`. ليس خروجًا طبيعيًا 0 |
| `git diff --check` | **PASS** | 0 |
| symlink | **SKIP** | `os.symlink` أعاد Windows `1314`. لم تُغيَّر صلاحيات الجهاز |
| Sandbox / VM | **NOT TESTED** | `WindowsSandbox.exe` غير موجود. لم يُشغَّل مثبّت. الأوامر في `f01-evidence/f01-isolated-vm-commands.txt` |

البيئة: Windows 10 Home 26H2 البناء 26300، Python 3.13.16. مفاتيح الاختبار تحت `HKCU\Software\NegmLoadingF01Test\<guid>` فقط. بعد التشغيل كان مفتاح الإزالة الإنتاجي غائبًا وقيمة Run باسم `Negm Lodaing` غائبة.

## الأثر والحدود

الفحص يقرأ ملفات الكتابة قبل النسخ. الاستبدال يكتب ملفًا مؤقتًا في المجلد نفسه حتى يبقى `os.replace` على المجلد نفسه. لا حذف تكراري للجذر. تشغيل `uninstall.cmd` ما زال يترك ملف cmd قيد التشغيل حتى لا يتحول خروج 0 إلى فشل كاذب بعد حذف الدفعة لنفسها؛ PowerShell يحذف المساعد بعد التحقق.

HKCU مع البيان يمنع تزوير البيان وحده، ولا يمنع المستخدم نفسه من إعادة كتابتهما معًا. هذا ليس توقيعًا. لم يُفترض أن المالك قبله.

نسخ `uninstall.cmd` القديمة على الأجهزة ما زالت تحتوي `rd /s /q`. هذا الالتزام لا يرحّلها، ولا يجوز تشغيلها. الترقية ترفض بيانًا بلا مرساة بدل تشغيل المزيل القديم.

التراجع: `git revert` لالتزام هذه الجولة ثم لالتزام تسجيل بصمته إن وُجد، من الأحدث إلى الأقدم. لا `reset --hard`.

## القراران

**شيفرة F-01: CONDITIONAL GO.**

عيوب الاستبدال التي أُعيد إنتاجها أُغلقت باختبارات عزل، ولا عطل فقد بيانات مفتوح داخل هذا المسار. الشرط الذي يمنع إعلان الإغلاق: قرار المالك بشأن حد HKCU، وSKIP للرابط الرمزي، وNOT TESTED للحزمة، وBLOCKED/STABILITY لخروج `run_all_tests.py`.

**الإصدار التنفيذي: NO-GO.**

الحزمة لم تُشغَّل في نظام معزول، وخروج المجموعة ليس 0 طبيعيًا، وترحيل النسخ القديمة غير محسوم.
