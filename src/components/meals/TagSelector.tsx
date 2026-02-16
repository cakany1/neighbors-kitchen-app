import { getDisplayLabel } from 'path/to/utilities'; // adjust path accordingly

// ... existing code ...

const options = (optionsList) => {
    // ...
    return optionsList.map(opt => ({
        label: getDisplayLabel(opt),
        value: opt.value,
    }));
};

// ... existing code ...

// On lines 72-75 replace these instances:

// ...
    {options.map(option => (
            <Option key={option.value} value={option.value}>
                {getDisplayLabel(option)}
            </Option>
        ))}
// ...

// ... on lines 99-102 similarly:

// ...
    options.forEach(opt => {
        console.log(getDisplayLabel(opt));
    });
// ...

// ... rest of existing code ...
