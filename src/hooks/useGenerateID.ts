import useLocalStorage, { LocalStorageEntityKey } from './useLocalStorage';

const useGenerateID = () => {
    const { get } = useLocalStorage();

    const getNewId = (key: LocalStorageEntityKey) => {
        const state = get(key);
        return 1 + state.reduce((prev, current) => {
            const currentId = current.id;
            if (prev > currentId) return prev;
            else return currentId;
        }, 0);
    };

    return (
        { getNewId }
    );
};

export default useGenerateID;
