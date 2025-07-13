export function merge(target: any, source: any) {
  if (!source || typeof source !== "object") {
    // 如果 source 不是对象或为 null，则无需合并
    return;
  }

  Object.keys(source).forEach((key) => {
    if (
      !source.hasOwnProperty(key) ||
      key === "__proto__" ||
      key === "constructor"
    ) {
      return;
    }

    const sourceValue = source[key];
    const targetValue = target[key];

    if (Array.isArray(sourceValue)) {
      // 如果源属性是数组
      // 策略：通常用源数组完全替换目标数组（进行深拷贝以避免引用问题）
      // 如果目标不是数组或者不存在，也直接用源数组的拷贝
      target[key] = JSON.parse(JSON.stringify(sourceValue));
    } else if (sourceValue !== null && typeof sourceValue === "object") {
      // 如果源属性是对象（但不是数组，也不是 null）
      if (
        !targetValue ||
        typeof targetValue !== "object" ||
        Array.isArray(targetValue)
      ) {
        // 如果目标不是对象，或者是数组，或者不存在，则初始化为一个新对象
        target[key] = {};
      }
      merge(target[key], sourceValue); // 递归合并
    } else {
      // 基本类型、null 或 undefined（来自 sourceValue）
      target[key] = sourceValue;
    }
  });
}
