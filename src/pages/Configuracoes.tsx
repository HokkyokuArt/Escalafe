import { Box, Button, Checkbox, FormControlLabel, Paper, Snackbar, TextField, Typography } from "@mui/material";
import Grid from '@mui/material/Grid2';
import { useRef, useState } from "react";
import CustomDialog, { DialogProps } from "../components/CustomDialog";
import useLocalStorage from "../hooks/useLocalStorage";
import { DiaSemana, diasSemanaLabel } from "../models/ScheduleConfig.model";
import { validateImportedData } from "../services/backup/importValidation";
import { hexToRgb, rgbToHex } from "../utils/utils";

const diasOrdenados: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];

const Configuracoes = () => {
    const { get, set, exportAll, importAll } = useLocalStorage();
    const [scheduleConfig, setScheduleConfig] = useState(get('scheduleConfig'));
    const [pdfConfig, setPdfConfig] = useState(get('pdfConfig'));
    const [feedback, setFeedback] = useState<string | null>(null);
    const [pendingImport, setPendingImport] = useState<any | null>(null);
    const importDialogState = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleDia = (dia: DiaSemana, checked: boolean) => {
        setScheduleConfig(prev => ({
            ...prev,
            diasSemana: checked
                ? [...prev.diasSemana, dia]
                : prev.diasSemana.filter(d => d !== dia),
        }));
    };

    const salvarConfiguracoes = () => {
        set('scheduleConfig', scheduleConfig);
        set('pdfConfig', pdfConfig);
        setFeedback('Configurações salvas com sucesso.');
    };

    const exportarJSON = () => {
        const data = exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const hoje = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `escalafe-backup-${hoje}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onSelecionarArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                const validation = validateImportedData(parsed);
                if (!validation.valid) {
                    setFeedback(`Arquivo inválido: ${validation.errors[0]}`);
                    return;
                }
                setPendingImport(parsed);
                importDialogState[1](true);
            } catch {
                setFeedback('Arquivo inválido. Verifique se é um backup exportado pelo EscalaFe.');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const confirmarImportacao = () => {
        if (!pendingImport) return;
        importAll(pendingImport);
        setScheduleConfig(get('scheduleConfig'));
        setPdfConfig(get('pdfConfig'));
        setPendingImport(null);
        importDialogState[1](false);
        setFeedback('Dados importados com sucesso.');
    };

    const importDialogProps: DialogProps = {
        state: importDialogState,
        onClose: () => setPendingImport(null),
        content: {
            header: 'Importar dados',
            body: <Typography>
                Todos os dados atuais (pessoas, funções, semanas especiais, escalas e configurações) serão substituídos pelos dados do arquivo importado. Essa ação não pode ser desfeita. Deseja continuar?
            </Typography>,
            footer: <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <Button variant="contained" color="error" onClick={() => { setPendingImport(null); importDialogState[1](false); }}>
                    Cancelar
                </Button>
                <Button variant="contained" color="success" onClick={confirmarImportacao}>Substituir dados</Button>
            </Box>
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Paper sx={{ padding: '20px' }}>
                <Typography variant="h6" sx={{ mb: '10px' }}>Dias da escala</Typography>
                <Grid container spacing={1}>
                    {diasOrdenados.map(dia => (
                        <Grid size={4} key={dia}>
                            <FormControlLabel
                                control={<Checkbox
                                    color="secondary"
                                    checked={scheduleConfig.diasSemana.includes(dia)}
                                    onChange={(_, checked) => toggleDia(dia, checked)}
                                />}
                                label={diasSemanaLabel[dia]}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            <Paper sx={{ padding: '20px' }}>
                <Typography variant="h6" sx={{ mb: '10px' }}>Configurações do PDF</Typography>
                <Grid container spacing={2} sx={{ mb: '20px' }}>
                    <Grid size={6}>
                        <TextField
                            color="secondary"
                            fullWidth
                            label="Título do documento"
                            variant="standard"
                            value={pdfConfig.titulo}
                            onChange={e => setPdfConfig(prev => ({ ...prev, titulo: e.target.value }))}
                        />
                    </Grid>
                    <Grid size={6}>
                        <TextField
                            color="secondary"
                            fullWidth
                            label="Versículo/rodapé"
                            variant="standard"
                            value={pdfConfig.versiculo}
                            onChange={e => setPdfConfig(prev => ({ ...prev, versiculo: e.target.value }))}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid size={2}>
                        <Typography variant="body2">Cor principal</Typography>
                        <input
                            type="color"
                            value={rgbToHex(pdfConfig.corPrincipal)}
                            onChange={e => setPdfConfig(prev => ({ ...prev, corPrincipal: hexToRgb(e.target.value) }))}
                        />
                    </Grid>
                    <Grid size={2}>
                        <Typography variant="body2">Cor secundária</Typography>
                        <input
                            type="color"
                            value={rgbToHex(pdfConfig.corSecundaria)}
                            onChange={e => setPdfConfig(prev => ({ ...prev, corSecundaria: hexToRgb(e.target.value) }))}
                        />
                    </Grid>
                    <Grid size={2}>
                        <Typography variant="body2">Cor do cabeçalho</Typography>
                        <input
                            type="color"
                            value={rgbToHex(pdfConfig.corCabecalho)}
                            onChange={e => setPdfConfig(prev => ({ ...prev, corCabecalho: hexToRgb(e.target.value) }))}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Também usada na coluna de data
                        </Typography>
                    </Grid>
                    <Grid size={2}>
                        <Typography variant="body2">Cor de semana especial</Typography>
                        <input
                            type="color"
                            value={rgbToHex(pdfConfig.corSemanaEspecial)}
                            onChange={e => setPdfConfig(prev => ({ ...prev, corSemanaEspecial: hexToRgb(e.target.value) }))}
                        />
                    </Grid>
                    <Grid size={2}>
                        <Typography variant="body2">Cor de linha par</Typography>
                        <input
                            type="color"
                            value={rgbToHex(pdfConfig.corLinhaPar)}
                            onChange={e => setPdfConfig(prev => ({ ...prev, corLinhaPar: hexToRgb(e.target.value) }))}
                        />
                    </Grid>
                    <Grid size={2}>
                        <Typography variant="body2">Cor de linha ímpar</Typography>
                        <input
                            type="color"
                            value={rgbToHex(pdfConfig.corLinhaImpar)}
                            onChange={e => setPdfConfig(prev => ({ ...prev, corLinhaImpar: hexToRgb(e.target.value) }))}
                        />
                    </Grid>
                    <Grid size={2}>
                        <Typography variant="body2">Cor da fonte</Typography>
                        <input
                            type="color"
                            value={rgbToHex(pdfConfig.corFonte)}
                            onChange={e => setPdfConfig(prev => ({ ...prev, corFonte: hexToRgb(e.target.value) }))}
                        />
                    </Grid>
                    <Grid size={2}>
                        <Typography variant="body2">Cor da borda das células</Typography>
                        <input
                            type="color"
                            value={rgbToHex(pdfConfig.corBorda)}
                            onChange={e => setPdfConfig(prev => ({ ...prev, corBorda: hexToRgb(e.target.value) }))}
                        />
                    </Grid>
                    <Grid size={4}>
                        <TextField
                            color="secondary"
                            fullWidth
                            type="number"
                            label="Quantidade de meses padrão"
                            variant="standard"
                            inputProps={{ min: 1 }}
                            value={pdfConfig.quantidadeMeses}
                            onChange={e => setPdfConfig(prev => ({ ...prev, quantidadeMeses: Math.max(1, Number(e.target.value)) }))}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Box>
                <Button variant="contained" color="success" onClick={salvarConfiguracoes}>Salvar configurações</Button>
            </Box>

            <Paper sx={{ padding: '20px' }}>
                <Typography variant="h6" sx={{ mb: '10px' }}>Backup</Typography>
                <Box sx={{ display: 'flex', gap: '20px' }}>
                    <Button variant="contained" color="info" onClick={exportarJSON}>Exportar dados (JSON)</Button>
                    <Button variant="contained" color="info" onClick={() => fileInputRef.current?.click()}>Importar dados (JSON)</Button>
                    <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={onSelecionarArquivo} />
                </Box>
            </Paper>

            <CustomDialog {...importDialogProps} />

            <Snackbar
                open={!!feedback}
                autoHideDuration={3000}
                onClose={() => setFeedback(null)}
                message={feedback}
            />
        </Box>
    );
};

export default Configuracoes;
