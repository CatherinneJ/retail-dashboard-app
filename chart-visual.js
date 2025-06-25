import Chart from 'chart.js/auto';

async function loadKeywordStats() {
  const res = await fetch('/api/keywords');
  const stats = await res.json();

  const ctx = document.getElementById('sales-chart').getContext('2d');
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
}

loadKeywordStats();
