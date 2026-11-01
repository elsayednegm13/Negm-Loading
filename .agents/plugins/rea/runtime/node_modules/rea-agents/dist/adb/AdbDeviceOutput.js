/**
 * Parsers for the exact adb and Package Manager output formats REA consumes.
 *
 * Each parser preserves what the tool actually printed: unparseable lines are
 * sampled and counted rather than silently dropped, and derived
 * classifications carry their evidence basis.
 */
import { adbHostFileName, } from "./AdbHostFileName.js";
import { collectUnparsedLines, } from "./AdbUnparsedLines.js";
import { ADB_DEVICE_STATES, } from "../domain/adb/adbDeviceAnalysis.js";
const DEVICE_LINE = /^(\S+)\s+(.*)$/u;
const normalizeAdbOutputLine = (rawLine) => rawLine.trimEnd();
export const isSuccessfulDaemonStartNotice = (line) => line === "* daemon started successfully" ||
    line === "* daemon started successfully *";
const metadataValue = (remainder, key) => {
    const match = new RegExp(`(?:^|\\s)${key}:(\\S+)`, "u").exec(remainder);
    return match === null ? null : match[1];
};
/**
 * Parse `adb devices -l` device lines. The banner, blank lines, and the
 * daemon startup notices adb prints on first use are recognized separately;
 * every other unrecognized line is sampled and counted for honest reporting.
 */
export const parseAdbDevicesOutput = (stdout, stderr = "") => {
    const devices = [];
    const unparsed = collectUnparsedLines();
    let daemonStarted = false;
    for (const rawLine of stdout.split(/\r?\n/u)) {
        const line = normalizeAdbOutputLine(rawLine);
        if (isSuccessfulDaemonStartNotice(line)) {
            daemonStarted = true;
            continue;
        }
        if (line === "" || line.startsWith("List of devices attached"))
            continue;
        if (line.startsWith("* daemon"))
            continue;
        const match = DEVICE_LINE.exec(line);
        const state = ADB_DEVICE_STATES.find((candidate) => {
            const remainder = match?.[2];
            if (remainder === undefined || !remainder.startsWith(candidate))
                return false;
            const next = remainder[candidate.length];
            return next === undefined || /\s/u.test(next);
        });
        if (match === null || state === undefined) {
            if (rawLine.trim() !== "")
                unparsed.add(rawLine);
            continue;
        }
        const serial = match[1];
        const remainder = match[2].slice(state.length);
        const usb = metadataValue(remainder, "usb");
        const transportIdText = metadataValue(remainder, "transport_id");
        const parsedTransportId = transportIdText === null || !/^\d+$/u.test(transportIdText)
            ? null
            : Number(transportIdText);
        const isEmulator = /^emulator-\d+$/u.test(serial);
        const kind = isEmulator
            ? "emulator"
            : usb !== null
                ? "physical"
                : "unknown";
        devices.push({
            serial,
            state,
            transport: usb !== null
                ? "usb"
                : isEmulator || serial.includes(":")
                    ? "tcp"
                    : "unknown",
            product: metadataValue(remainder, "product"),
            model: metadataValue(remainder, "model"),
            device: metadataValue(remainder, "device"),
            transport_id: parsedTransportId,
            kind,
            kind_basis: kind === "emulator"
                ? "emulator_serial_prefix"
                : kind === "physical"
                    ? "usb_transport"
                    : "none",
        });
    }
    if (!daemonStarted && stderr !== "") {
        for (const rawLine of stderr.split(/\r?\n/u)) {
            const line = normalizeAdbOutputLine(rawLine);
            if (isSuccessfulDaemonStartNotice(line)) {
                daemonStarted = true;
                break;
            }
        }
    }
    return { devices, unparsedLines: unparsed.facts(), daemonStarted };
};
/**
 * Properties projected from a `getprop` dump. The whitelist keeps device
 * inspection to build identity facts; a full dump is out of scope.
 */
const DEVICE_PROPERTY_WHITELIST = [
    "ro.build.version.release",
    "ro.build.version.sdk",
    "ro.build.version.security_patch",
    "ro.build.id",
    "ro.build.fingerprint",
    "ro.build.characteristics",
    "ro.debuggable",
    "ro.kernel.qemu",
    "ro.product.brand",
    "ro.product.device",
    "ro.product.manufacturer",
    "ro.product.model",
    "ro.product.cpu.abilist",
];
/** Parse a full `getprop` dump into `[name]: [value]` pairs. */
export const parseGetpropOutput = (stdout) => {
    const values = new Map();
    for (const rawLine of stdout.split(/\r?\n/u)) {
        const match = /^\[([^\]]+)\]:\s*\[(.*)\]$/u.exec(rawLine.trim());
        if (match === null)
            continue;
        values.set(match[1], match[2]);
    }
    const properties = DEVICE_PROPERTY_WHITELIST.flatMap((name) => {
        const value = values.get(name);
        return value === undefined
            ? []
            : [{ name, value }];
    });
    const qemu = values.get("ro.kernel.qemu");
    return {
        properties,
        emulatorObserved: qemu === undefined ? null : qemu === "1",
    };
};
const PACKAGE_LINE = /^package:(.+)=([^\s=]+)$/u;
/** Parse `pm list packages -f` lines, sampling and counting unrecognized lines. */
export const parsePackageListOutput = (stdout) => {
    const packages = [];
    const unparsed = collectUnparsedLines();
    for (const rawLine of stdout.split(/\r?\n/u)) {
        const line = rawLine.trim();
        if (line === "")
            continue;
        const match = PACKAGE_LINE.exec(line);
        if (match === null) {
            unparsed.add(rawLine);
            continue;
        }
        packages.push({
            package_name: match[2],
            base_apk_device_path: match[1],
        });
    }
    return { packages, unparsedLines: unparsed.facts() };
};
/** Quote raw device paths for prose without allowing bidi or invisible text. */
export const displayDevicePath = (devicePath) => {
    let excerpt = "";
    let count = 0;
    for (const character of devicePath) {
        if (count === 160)
            break;
        excerpt += character;
        count += 1;
    }
    const quoted = JSON.stringify(excerpt).replace(/[\p{C}\p{Z}\p{Default_Ignorable_Code_Point}\u2800]/gu, (character) => character === " "
        ? character
        : `\\u{${character.codePointAt(0).toString(16).toUpperCase()}}`);
    return excerpt.length === devicePath.length ? quoted : `${quoted} (excerpt)`;
};
/**
 * Parse `pm path PACKAGE` lines. The base/split role is derived from the file
 * name (`base.apk`, `split_*.apk`), which is the only signal the output
 * carries; any other name reports an unknown role.
 */
export const parsePmPathOutput = (stdout, platform = process.platform) => {
    const paths = [];
    const rejectedPaths = [];
    const unparsed = collectUnparsedLines();
    for (const rawLine of stdout.split(/\r?\n/u)) {
        if (rawLine === "")
            continue;
        const match = /^package:(.*)$/u.exec(rawLine);
        if (match === null) {
            unparsed.add(rawLine);
            continue;
        }
        const devicePath = match[1];
        const validated = adbHostFileName(devicePath, platform);
        if (!validated.ok) {
            rejectedPaths.push({
                device_path: devicePath,
                reason: validated.reason,
            });
            continue;
        }
        const fileName = validated.fileName;
        paths.push({
            device_path: devicePath,
            file_name: fileName,
            role: fileName === "base.apk"
                ? "base"
                : fileName.startsWith("split_") && fileName.endsWith(".apk")
                    ? "split"
                    : "unknown",
        });
    }
    return { paths, rejectedPaths, unparsedLines: unparsed.facts() };
};
