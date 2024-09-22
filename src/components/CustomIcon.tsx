import { Icon } from '@mui/material';

type Props = {
    icon: string;
    fontSize?: string;
    color?: string;
    onClick?: () => void;
};

const CustomIcon = (props: Props) => {
    return (
        <Icon
            sx={{
                fontSize: props.fontSize ?? '22px',
                minWidth: '30px',
                width: 'fit-content',
                color: props.color
            }}
            className={props.icon}
            onClick={props.onClick}
        ></Icon>
    );
};

export default CustomIcon;
