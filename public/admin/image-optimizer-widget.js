// Wait for CMS to be fully loaded
if (window.CMS) {
  initWidget();
} else {
  window.addEventListener('DOMContentLoaded', initWidget);
}

function initWidget() {
  // Load image compression library
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js';
  document.head.appendChild(script);
  
  script.onload = () => {
    const ImageOptimizer = window.createClass({
      getInitialState() {
        return {
          optimizing: false,
          result: null,
          preview: this.props.value || null
        };
      },

      handleChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        const original = (file.size / 1024 / 1024).toFixed(2);
        this.setState({ optimizing: true, result: null });

        window.imageCompression(file, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          initialQuality: 0.85
        }).then(compressed => {
          const size = (compressed.size / 1024 / 1024).toFixed(2);
          const saved = Math.round(((file.size - compressed.size) / file.size) * 100);
          const url = URL.createObjectURL(compressed);
          
          this.setState({
            preview: url,
            result: { original, size, saved },
            optimizing: false
          });

          const optimized = new File([compressed], file.name, { type: compressed.type });
          this.props.onChange(optimized);
        }).catch(err => {
          console.error(err);
          alert('Optimization failed');
          this.setState({ optimizing: false });
        });
      },

      render() {
        const h = window.h;
        const { optimizing, result, preview } = this.state;
        
        return h('div', { style: 'padding: 1rem' },
          h('input', {
            type: 'file',
            accept: 'image/*',
            onChange: this.handleChange.bind(this),
            disabled: optimizing,
            style: 'margin-bottom: 1rem; display: block'
          }),
          
          optimizing && h('div', {
            style: 'padding: 1rem; background: #FFF3E0; border: 1px solid #FFB74D; border-radius: 4px; margin-bottom: 1rem'
          }, '⏳ Optimizing...'),
          
          result && h('div', {
            style: 'padding: 1rem; background: #E8F5E9; border: 1px solid #4CAF50; border-radius: 4px; margin-bottom: 1rem'
          }, [
            h('div', { style: 'font-weight: 600; color: #2E7D32' }, '✓ Optimized!'),
            h('div', { style: 'font-size: 0.875rem; margin-top: 0.5rem' },
              `${result.original}MB → ${result.size}MB (${result.saved}% saved)`
            )
          ]),
          
          preview && h('img', {
            src: preview,
            style: 'max-width: 300px; border: 1px solid #ddd; border-radius: 4px; margin-top: 1rem'
          })
        );
      }
    });

    window.CMS.registerWidget('image-optimizer', ImageOptimizer);
  };
}