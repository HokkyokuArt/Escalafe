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
