async function loadKeywordStats() {
  try {
    const res = await fetch('/api/keywords');
    const stats = await res.json();

    const canvas = document.getElementById('sales-chart');
    if (!canvas) return;  

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Positive', 'Negative'],
        datasets: [{
          label: 'Number of Occurrences',
          data: [stats.positive, stats.negative],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      },
      options: {
        responsive: true,            
        plugins: {
          title: {
            display: true,
            text: 'Review analysis by keywords'
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to load keyword stats:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadKeywordStats();
});

