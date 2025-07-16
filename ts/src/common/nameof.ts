/**
 * Return the name of the key on the given object
 *
 * This will break and return a compilation error if the field is updated
 *
 * @param name the name of the parameter, constrained to properties on T
 * @returns the name of the property
 */
export const nameof = <T>(name: Extract<keyof T, string>): string => name;
