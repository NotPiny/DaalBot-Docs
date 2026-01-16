<script lang="ts">
	export let href = '';
	export let text = '';
	export let variant: 'primary' | 'success' | 'warning' | 'secondary' = 'primary';
</script>

<a {href} class="btn btn-{variant}" target="_blank" rel="noopener noreferrer">
	{text}
</a><br/>

<style>
	.btn {
		display: block;
		padding: 0.75rem 1.5rem;
		border-radius: 0.375rem;
		text-decoration: none;
		font-weight: 600;
		text-align: center;
		transition: all 0.15s ease-in-out;
		border: none;
		cursor: pointer;

        color: white !important;
	}

	/* Shove the button as far right as possible when on mobile */
	@media (min-width: 1000px) {
		.btn {
			float: left;
		}
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background-color: #2563eb;
	}

	.btn-success {
		background-color: #10b981;
		color: white;
	}

	.btn-success:hover {
		background-color: #059669;
	}

	.btn-warning {
		background-color: #f59e0b;
		color: white;
	}

	.btn-warning:hover {
		background-color: #d97706;
	}

	.btn-secondary {
		background-color: #6b7280;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #4b5563;
	}
</style>