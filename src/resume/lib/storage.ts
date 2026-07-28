// Builder-local copy of the guarded localStorage write (self-contained app -
// no imports from the rest of src/). A full or unavailable store surfaces as
// a console error plus a one-time alert instead of an unhandled throw.

let warned = false;

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    warned = false;
    return true;
  } catch (e) {
    console.error(`Failed to write localStorage key "${key}"`, e);
    if (!warned) {
      warned = true;
      alert(
        "Saving failed: browser storage is full or unavailable. Your latest change was not persisted."
      );
    }
    return false;
  }
}
