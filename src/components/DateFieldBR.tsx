import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { formatDateBR } from "../services/schedule/dateUtils";
import CustomIcon from "./CustomIcon";

type Props = {
    label: string;
    value: string;
    onChange: (iso: string) => void;
    error?: boolean;
    required?: boolean;
};

const formatDigitsAsDate = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    return parts.join('/');
};

const parseToIso = (texto: string): string | null => {
    const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, d, m, y] = match;
    return `${y}-${m}-${d}`;
};

const DateFieldBR = ({ label, value, onChange, error, required }: Props) => {
    const [texto, setTexto] = useState(value ? formatDateBR(value) : '');
    const calendarioRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTexto(value ? formatDateBR(value) : '');
    }, [value]);

    const abrirCalendario = () => {
        const input = calendarioRef.current;
        if (!input) return;
        if (typeof input.showPicker === 'function') {
            input.showPicker();
        } else {
            input.focus();
        }
    };

    return (
        <TextField
            color="secondary"
            fullWidth
            label={required ? `${label} *` : label}
            variant="standard"
            placeholder="dd/mm/aaaa"
            error={error}
            value={texto}
            onChange={e => {
                const formatado = formatDigitsAsDate(e.target.value);
                setTexto(formatado);
                const iso = parseToIso(formatado);
                if (iso) onChange(iso);
                else if (formatado === '') onChange('');
            }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton size="small" edge="end" onClick={abrirCalendario}>
                            <CustomIcon icon="fa-solid fa-calendar-days" fontSize="16px" />
                        </IconButton>
                        <input
                            ref={calendarioRef}
                            type="date"
                            value={value || ''}
                            onChange={e => onChange(e.target.value)}
                            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, border: 'none', padding: 0 }}
                            tabIndex={-1}
                        />
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default DateFieldBR;
