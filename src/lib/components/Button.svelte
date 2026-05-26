<script lang="ts">
    export let href = '';
    export let text = '';
    export let variant: 'primary' | 'success' | 'warning' | 'secondary' = 'primary';
</script>

<a {href} class="btn btn-{variant}" target="_blank" rel="noopener noreferrer">
    <span class="state-layer"></span>
    {text}
</a>

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        
        height: 40px;
        padding-inline: 24px;
        border-radius: 9999px;
        
        font-family: var(--sl-font, system-ui);
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.1px;
        text-decoration: none;
        text-align: center;
        
        border: none;
        cursor: pointer;
        user-select: none;
        transition: box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);
    }

    @media (max-width: 1000px) {
        .btn {
            display: flex;
            width: 100%;
        }
    }

    /* M3 state layer: an overlay that tints the button using its own text color */
    .state-layer {
        position: absolute;
        inset: 0;
        background-color: currentColor;
        opacity: 0;
        transition: opacity 0.15s linear;
    }

    .btn:hover .state-layer {
        opacity: 0.08;
    }
    
    .btn:focus .state-layer {
        opacity: 0.12;
        outline: none;
    }
    
    .btn:active {
        box-shadow: none !important;
    }
    .btn:active .state-layer {
        opacity: 0.12;
    }

    .btn-primary {
        background-color: var(--md-sys-color-primary, #615690) !important;
        color: var(--md-sys-color-on-primary, #ffffff) !important;
        box-shadow: none; 
    }
    .btn-primary:hover {
        box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
    }

    .btn-secondary {
        background-color: var(--md-sys-color-secondary-container, #e6e0e9) !important;
        color: var(--md-sys-color-on-secondary-container, #1c1b1f) !important;
    }

    .btn-success {
        background-color: var(--md-sys-color-success-container, rgb(204 245 217)) !important;
        color: var(--md-sys-color-on-success-container, rgb(0 53 26)) !important;
    }

    .btn-warning {
        background-color: var(--md-sys-color-tertiary-container, rgb(255 218 229)) !important;
        color: var(--md-sys-color-on-tertiary-container, rgb(65 0 27)) !important;
    }
</style>