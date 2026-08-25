export const toISODate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const parseISODate = (iso: string): Date => new Date(`${iso}T00:00:00`);

export const weekKeyFor = (iso: string): string => {
    const d = parseISODate(iso);
    const offsetDaSegunda = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offsetDaSegunda);
    return toISODate(d);
};

export const addMonths = (iso: string, months: number): string => {
    const d = parseISODate(iso);
    d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate() - 1);
    return toISODate(d);
};

export const formatDateBR = (iso: string): string => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

export const DIAS_SEMANA_PT = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];

export const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const weekdayNamePt = (iso: string): string => DIAS_SEMANA_PT[parseISODate(iso).getDay()];

export const monthNamePt = (iso: string): string => MESES_PT[Number(iso.split('-')[1]) - 1];
