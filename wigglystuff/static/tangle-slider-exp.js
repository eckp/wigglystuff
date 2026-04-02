function render({model, el}) {
    const config = {
        basevalue: model.get("amount"),
        minValue: model.get("min_value"),
        maxValue: model.get("max_value"),
        minSteps: 0,
        maxSteps: 0,
        stepSize: model.get("step"),
        prefix: model.get("prefix"),
        suffix: model.get("suffix"),
        digits: model.get("digits"),
        pixelsPerStep: model.get("pixels_per_step")
    };

    config.minSteps = Math.floor(Math.log(config.minValue/config.basevalue)/Math.log(1+config.stepSize))
    config.maxSteps = Math.ceil(Math.log(config.maxValue/config.basevalue)/Math.log(1+config.stepSize))

    let abs_steps = 0
    let amount = config.basevalue

    const container = document.createElement('div');
    container.classList.add("tangle-container");
    el.style.display = "inline-flex";
    el.appendChild(container);

    // Listen for external changes to all config traitlets
    ["amount", "min_value", "max_value", "step", "prefix", "suffix", "digits", "pixels_per_step"].forEach(name => {
        model.on(`change:${name}`, () => {
            config.minValue = model.get("min_value");
            config.maxValue = model.get("max_value");
            config.stepSize = model.get("step");
            config.prefix = model.get("prefix");
            config.suffix = model.get("suffix");
            config.digits = model.get("digits");
            config.pixelsPerStep = model.get("pixels_per_step");
            amount = model.get("amount");
            config.minSteps = Math.floor(Math.log(config.minValue/config.basevalue)/Math.log(1+config.stepSize))
            config.maxSteps = Math.ceil(Math.log(config.maxValue/config.basevalue)/Math.log(1+config.stepSize))
            // FIXME: code duplication
            renderValue();
        });
    });

    function renderValue() {
        container.innerHTML = '';
        const element = document.createElement('span');
        element.className = 'tangle-value';
        element.style.color = '#0066cc';
        element.style.textDecoration = 'underline';
        element.style.cursor = 'ew-resize';
        element.textContent = config.prefix + amount.toFixed(config.digits) + config.suffix;
        element.addEventListener('mousedown', startDragging);
        container.appendChild(element);
    }

    function updateModel() {
        model.set("amount", amount);
        model.save_changes();
    }

    let updateTimeout;
    function debouncedUpdateModel() {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateModel, 50); // Debounce for 100ms
    }

    function startDragging(e) {
        e.preventDefault();
        const element = e.target;
        element.style.cursor = 'grabbing';
        const startX = e.clientX;
        const startSteps = abs_steps
        
        function onMouseMove(e) {
            const deltaX = e.clientX - startX;
            const steps = Math.floor(deltaX / config.pixelsPerStep);
            abs_steps = Math.max(config.minSteps, 
                           Math.min(config.maxSteps, 
                                    startSteps + steps));
            amount = Math.max(config.minValue, 
                           Math.min(config.maxValue, 
                                    config.basevalue * (1 + config.stepSize) ** abs_steps));
            renderValue();
            debouncedUpdateModel();
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            element.style.cursor = 'ew-resize';
            updateModel();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    renderValue();
}

export default { render };
