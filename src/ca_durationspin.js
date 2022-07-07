class CA_DurationSpin extends HTMLElement {

    static get is() {
        return "ca-duration-spin";
    }

    static get observedAttributes() {
        return ["value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name.toLowerCase()==="value") {
            this.number = ~~newValue;
            this.display();
        }
    }

    // seconds to hh:mm:ss or mm:ss
    hms(value) {
        var seconds = value % 60;
        var minutes = Math.floor(value / 60) % 60;
        var hours = Math.floor(value / 3600);
        seconds = Math.floor(seconds); // round to nearest second
        return (hours + ':' + minutes + ':' + seconds)
            .replace(/\d+/g, (m) => "0".substr(m.length -1) + m ) // pad zeros
            .replace(/^00:/, '') // remove leading zeros when empty;
    }

    emit(name) {
        this.dispatchEvent(new Event(name, { bubbles: true }))
        // this.dispatchEvent(new CustomEvent('changed', {detail: this.number}));
    }

    // take the internal value and render the time representation
    display() {
        this.input.value = this.hms(this.number);
        this.input.setAttribute('size', this.input.value.length);
    }

    // handlers for incrementing and decrementing the internal value
    onMinus() {
        this.number = Math.max(this.min, this.number - this.step);
        this.display();
        this.onChange();
    }
    onPlus() {
        this.number = Math.min(this.max, this.number + this.step);
        this.display();
        this.onChange();
    }

    // handlers for holding the buttons (repeat trigger)
    holdMinus() {
        this.clearHold();
        this.onMinus(this);
        this._interval = setInterval(this.onMinus.bind(this), this.repeat_rate);
    }
    holdPlus() {
        this.clearHold();
        this.onPlus(this);
        this._interval = setInterval(this.onPlus.bind(this), this.repeat_rate);
    }
    clearHold() {
        clearInterval(this._interval);
    }

    // update the value attribute of the element when the displayed value changes
    onChange() {
        this.setAttribute('value', this.number); // the attribute on the element - triggers observer
        this.value = this.number; // the property called 'value' on the event target - does not trigger observer
        this.emit('change');
    }

    // mouse wheel event can trigger much faster than holding the button
    onWheel(e) {
        e.preventDefault();
        e.deltaY > 0 ? this.onPlus() : this.onMinus();
    }

    // the string containing the html for this element
    template() {
        return `<style>input{min-width:5ch}button{cursor:pointer}</style>
            <button>${this.labels.minus}</button><input type='text' value='00:00' size='5' readonly><button>${this.labels.plus}</button>`;                
    }

    // get an attribute value if it is set, otherwise assume empty string
    attrib(name) {
        return this.attributes[name] ? this.attributes[name].value : '';
    }

    // render this element
    render() {
        this.shadow.innerHTML = this.template();
    }

    connectedCallback() {

        // calulate values required before rendering
        if (this.attrib('minus').length) this.labels.minus = this.attrib('minus');
        if (this.attrib('plus').length) this.labels.plus = this.attrib('plus');

        // now we know our labels we can render
        this.render();

        // references to DOM nodes
        this.minus = this.shadow.querySelector("button:first-of-type");
        this.plus = this.shadow.querySelector("button:last-of-type");
        this.input = this.shadow.querySelector("input");

        // calculate the instance values
        this.min = Math.max(0, ~~this.attrib('min')); // ~~ coerces to int, zero or more
        this.number = Math.max(this.min, ~~this.attrib('value')); // use cooersion instead of parseInt to avoid NaN values
        this.step = Math.max(1, ~~this.attrib('step')); // 1 or more
        this.max = Math.min(86400, Math.max(this.min + this.step, ~~this.attrib('max'))); // max is 24 hours, max must exceed min by at least step

        // bind events
        this.minus.addEventListener("click", this.clearHold.bind(this));
        this.minus.addEventListener("mousedown", this.holdMinus.bind(this));
        this.minus.addEventListener("mouseup", this.clearHold.bind(this));
        this.plus.addEventListener("click", this.clearHold.bind(this));
        this.plus.addEventListener("mousedown", this.holdPlus.bind(this));
        this.plus.addEventListener("mouseup", this.clearHold.bind(this));
        this.input.addEventListener("wheel", this.onWheel.bind(this));

        // ensure as you move the mouse out after button is held the interval is cleared
        this.shadow.addEventListener("mouseout", this.clearHold.bind(this));

        // ensure input matches the internal value
        this.display();

    }

    disconnectedCallback() {
        this.minus.removeEventListener("click", this.clearHold.bind(this));
        this.minus.removeEventListener("mousedown", this.holdMinus.bind);
        this.minus.removeEventListener("mouseup", this.clearHold.bind);
        this.plus.removeEventListener("click", this.clearHold.bind(this));
        this.plus.removeEventListener("mousedown", this.holdPlus.bind);
        this.plus.removeEventListener("mouseup", this.clearHold.bind);
        this.input.removeEventListener("wheel", this.onWheel.bind);
        this.shadow.removeEventListener("mouseout",this.clearHold.bind(this));
    }

    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'}); // closed ok too 
        this.value = 0;
        this.repeat_rate = 175;

        // values to track
        this.labels = {
            "minus": "-",
            "plus": "+"
        };

    }

}

customElements.define(CA_DurationSpin.is, CA_DurationSpin);