export const rgbToHex = (rgb: { r: number; g: number; b: number; }): string => {
    const toHex = (value: number) => value.toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number; } => {
    const sanitized = hex.replace('#', '');
    return {
        r: parseInt(sanitized.substring(0, 2), 16),
        g: parseInt(sanitized.substring(2, 4), 16),
        b: parseInt(sanitized.substring(4, 6), 16),
    };
};

export const abreviarNome = (nomeCompleto: string): string => {
    const [primeiroNome, ...sobrenomes] = nomeCompleto.trim().split(/\s+/);
    if (sobrenomes.length === 0) return primeiroNome;
    const sobrenomesAbreviados = sobrenomes.map(sobrenome => `${sobrenome.charAt(0)}.`);
    return [primeiroNome, ...sobrenomesAbreviados].join(' ');
};

export const resolve = (obj: any, field: string) => {
    const split = field.split('.');
    let toReturn = obj;
    split.forEach(s =>
        toReturn = toReturn?.[s]
    );
    return toReturn;
};

export const sortArray = <T extends {} | string | number>(
    array: T[],
    opt?: {
        fieldToSort?: string[] | string,
        orderDirection?: 'ASC' | 'DESC';
        nullableFirst?: boolean;
    }
): T[] => {
    const isObjArray = typeof array[0] === 'object';
    if (isObjArray && (opt?.fieldToSort === undefined || opt.fieldToSort.length === 0)) {
        throw new Error('Deve informar fieldsToSort se o array for de objeto');
    }
    const fields = Array.isArray(opt?.fieldToSort!) ? opt?.fieldToSort! : Array.of(opt?.fieldToSort!);
    const orderDirection = opt?.orderDirection || 'ASC';
    const nullableFirst = opt?.nullableFirst ?? false;

    const compareFunction = (a: any, b: any): number => {
        let comparison = 0;
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const valueA = isObjArray ? resolve(a, field) : a;
            const valueB = isObjArray ? resolve(b, field) : b;

            if (valueA === null || valueA === undefined) {
                comparison = valueB === null || valueB === undefined ? 0 : (nullableFirst ? -1 : 1);
            } else if (valueB === null || valueB === undefined) {
                comparison = nullableFirst ? 1 : -1;
            } else {
                const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
                comparison = collator.compare(valueA.toString(), valueB.toString());
            }

            if (comparison !== 0) break;
        }
        return orderDirection === 'DESC' ? -comparison : comparison;
    };

    return Array.from(array).sort(compareFunction);
};
