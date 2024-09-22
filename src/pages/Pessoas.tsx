import { Box, Button, Checkbox, FormControlLabel, FormGroup, TextField } from "@mui/material";
import Grid from '@mui/material/Grid2';
import { useState } from "react";
import CustomDialog, { DialogProps } from "../components/CustomDialog";
import CustomIcon from "../components/CustomIcon";
import FloatingActionsComponent, { FloatingActions } from "../components/FloatingActions";
import TableCustom, { ConfigCustomTable } from "../components/TableCustom";
import { Status } from "../enum/Status";
import useLocalStorage from "../hooks/useLocalStorage";
import { Funcoes } from "../models/Funcoes.model";
import { Pessoa } from "../models/Pessoa.model";

const Pessoas = () => {
    const [openDialogNovo, setOpenDialogNovo] = useState(false);
    const { get, set } = useLocalStorage();

    const funcoes = get('funcoes');
    const [novaPessoa, setNovaPessoa] = useState<null | Partial<Pessoa>>(null);
    const resetPessoa = () => {
        setNovaPessoa(null);
    };

    const addNovaPessoa = () => {
        setNovaPessoa({ nome: '', funcoes: [], status: Status.ATIVO });
    };

    const onChangeCheckbox = (checked: boolean, funcao: Funcoes) => {
        setNovaPessoa(prev => {
            const funcoesCopy = prev?.funcoes?.slice() ?? [];
            const funcoesToSet = checked
                ? [...funcoesCopy, funcao]
                : funcoesCopy?.filter(f => f.nome !== funcao.nome);

            return { ...prev, funcoes: funcoesToSet };
        });
    };

    const savePessoa = () => {
        const pessoas = get('pessoas');
        pessoas.push(novaPessoa as Pessoa);
        set('pessoas', pessoas);
        resetPessoa();
        setOpenDialogNovo(false);
    };

    const config: ConfigCustomTable[] = [
        {
            key: 'nome',
            label: 'Nome',
        },
        {
            key: 'status',
            label: 'Status',
            width: '20%',
            customTemplate: (data, config) => {
                const iconInfo = data[config.key] === Status.ATIVO
                    ? { icon: 'fa-circle-check', color: 'green' }
                    : { icon: 'fa-circle-xmark', color: 'red' };
                return (
                    <CustomIcon
                        icon={`fa-solid ${iconInfo.icon}`}
                        color={iconInfo.color}
                    />
                );
            }
        },
    ];

    const fa: FloatingActions = [
        {
            id: 'novo',
            icon: 'fa-solid fa-plus',
            label: 'Novo',
            onClick: () => {
                setOpenDialogNovo(true);
                addNovaPessoa();
            }
        }
    ];

    const dialogNovoProps: DialogProps = {
        openState: { open: openDialogNovo, setOpen: setOpenDialogNovo },
        onClose: () => {
            resetPessoa();
        },
        content: {
            header: "Adicionar pessoa",
            body: <Box>
                <FormGroup>
                    <TextField
                        color="secondary"
                        fullWidth
                        id="nome"
                        label="Nome *"
                        variant="standard"
                        sx={{
                            mb: '20px'
                        }}
                        value={novaPessoa?.nome}
                        onChange={event => {
                            const value = event.target.value?.toUpperCase();
                            setNovaPessoa(prev => ({ ...prev, nome: value }));
                        }}
                    />

                    <Grid container spacing={2}>
                        {funcoes.map((funcao, index) => {
                            return <Grid size={4} key={index}>
                                <FormControlLabel
                                    control={<Checkbox
                                        color="secondary"
                                        checked={!!novaPessoa?.funcoes?.find(f => f.nome === funcao.nome)}
                                        onChange={(_, checked) => { onChangeCheckbox(checked, funcao); }}
                                    />}
                                    label={funcao.nome} />
                            </Grid>;
                        }
                        )}

                    </Grid>
                </FormGroup>
            </Box>,
            footer: <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '20px'
                }}>
                <Button variant="contained" onClick={() => { resetPessoa(); setOpenDialogNovo(false); }}>
                    Cancelar
                </Button>
                <Button variant="contained" color="success" onClick={savePessoa}>Salvar</Button>
            </Box>
        }
    };

    return (
        <>
            <TableCustom localSotorageKey='pessoas' config={config} />
            <FloatingActionsComponent floatingActions={fa} />
            <CustomDialog {...dialogNovoProps} />
        </>
    );
};

export default Pessoas;
