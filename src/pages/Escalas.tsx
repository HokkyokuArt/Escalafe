import { Box, Button, Snackbar, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CustomDialog, { DialogProps } from "../components/CustomDialog";
import FloatingActionsComponent, { FloatingActions } from "../components/FloatingActions";
import TableCustom, { ConfigCustomTable, OptionsRow } from "../components/TableCustom";
import useLocalStorage from "../hooks/useLocalStorage";
import { Schedule, ScheduleStatus } from "../models/Schedule.model";
import { generateSchedulePdfBlob } from "../services/pdf/ScheduleDocument";
import { formatDateBR } from "../services/schedule/dateUtils";
import { validateSchedule, ValidationResult } from "../services/validation/validateSchedule";

const Escalas = () => {
    const navigate = useNavigate();
    const { get, set } = useLocalStorage();
    const [shouldUpdateRows, setShouldUpdateRows] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [escalaPendente, setEscalaPendente] = useState<{ escala: Schedule; validacao: ValidationResult; } | null>(null);
    const confirmPdfDialogState = useState(false);
    const theme = useTheme();

    const abrirPdf = async (escala: Schedule) => {
        const pessoas = get('pessoas');
        const funcoes = get('funcoes');
        const pdfConfig = get('pdfConfig');
        const blob = await generateSchedulePdfBlob(escala, pessoas, funcoes, pdfConfig);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const gerarPdf = (row: Schedule) => {
        const pessoas = get('pessoas');
        const funcoes = get('funcoes');
        const resultado = validateSchedule(row, pessoas, funcoes);

        if (!resultado.valid) {
            setFeedback(`Não é possível gerar o PDF: ${resultado.errors.length} erro(s) encontrado(s). Abra a escala para corrigir.`);
            return;
        }

        if (resultado.warnings.length) {
            setEscalaPendente({ escala: row, validacao: resultado });
            confirmPdfDialogState[1](true);
            return;
        }

        abrirPdf(row);
    };

    const confirmarPdfComAvisos = () => {
        confirmPdfDialogState[1](false);
        if (escalaPendente) abrirPdf(escalaPendente.escala);
        setEscalaPendente(null);
    };

    const confirmPdfDialogProps: DialogProps = {
        state: confirmPdfDialogState,
        onClose: () => setEscalaPendente(null),
        content: {
            header: 'Gerar PDF com avisos',
            body: <Typography>
                A escala "{escalaPendente?.escala.nome}" possui {escalaPendente?.validacao.warnings.length ?? 0} aviso(s) que não impedem a geração, mas indicam pontos de atenção na distribuição. Deseja gerar o PDF mesmo assim?
            </Typography>,
            footer: <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <Button variant="contained" color="error" onClick={() => { confirmPdfDialogState[1](false); setEscalaPendente(null); }}>Cancelar</Button>
                <Button variant="contained" color="success" onClick={confirmarPdfComAvisos}>Gerar mesmo assim</Button>
            </Box>
        }
    };

    const config: ConfigCustomTable[] = [
        { key: 'nome', label: 'Nome' },
        { key: 'periodo', label: 'Período', convertFn: data => `${formatDateBR(data.dataInicio)} a ${formatDateBR(data.dataFim)}` },
        { key: 'status', label: 'Status', convertFn: data => data.status === ScheduleStatus.FINALIZADA ? 'Finalizada' : 'Rascunho' },
        { key: 'atualizadoEm', label: 'Última alteração', convertFn: data => new Date(data.atualizadoEm).toLocaleString('pt-BR') },
    ];

    const optionsRow: OptionsRow[] = [
        {
            id: 'abrir',
            icon: () => 'fa-solid fa-pencil',
            color: () => theme.palette.info.main,
            label: () => 'Abrir / Editar',
            onClick: row => navigate(`/escalas/${row.id}`),
        },
        {
            id: 'gerar-pdf',
            icon: () => 'fa-solid fa-file-pdf',
            color: () => theme.palette.success.main,
            label: () => 'Gerar PDF',
            onClick: row => gerarPdf(row),
        },
        {
            id: 'excluir',
            icon: () => 'fa-solid fa-trash-can',
            color: () => theme.palette.error.main,
            label: () => 'Excluir',
            onClick: row => {
                const schedules = get('schedules');
                set('schedules', schedules.filter(s => s.id !== row.id));
                setShouldUpdateRows(true);
            }
        },
    ];

    const fa: FloatingActions = [
        {
            id: 'nova',
            icon: 'fa-solid fa-plus',
            label: 'Nova escala',
            onClick: () => navigate('/escalas/nova'),
        }
    ];

    return (
        <>
            <TableCustom
                localStorageKey='schedules'
                config={config}
                optionsRow={optionsRow}
                shouldUpdate={shouldUpdateRows}
                setShouldUpdate={setShouldUpdateRows}
            />
            <FloatingActionsComponent floatingActions={fa} />
            <CustomDialog {...confirmPdfDialogProps} />
            <Snackbar
                open={!!feedback}
                autoHideDuration={5000}
                onClose={() => setFeedback(null)}
                message={feedback}
            />
        </>
    );
};

export default Escalas;
