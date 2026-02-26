document.addEventListener('DOMContentLoaded', function () {
  initTableHighlighting();
  boldBestValues();
  initStickyNav();
  initCategoryPie();
  initDifficultyPie();
  initSubtaskGroupedBar();
  initVennDiagram();
});

/* ===== Column highlight on hover ===== */

function initTableHighlighting() {
  var table = document.getElementById('results-table');
  if (!table) return;

  var cells = table.querySelectorAll('th[data-col], td[data-col]');

  cells.forEach(function (cell) {
    cell.addEventListener('mouseenter', function () {
      var col = this.getAttribute('data-col');
      table.querySelectorAll('[data-col="' + col + '"]').forEach(function (c) {
        c.classList.add('col-highlight');
      });
    });

    cell.addEventListener('mouseleave', function () {
      var col = this.getAttribute('data-col');
      table.querySelectorAll('[data-col="' + col + '"]').forEach(function (c) {
        c.classList.remove('col-highlight');
      });
    });
  });
}

/* ===== Auto-bold highest value per column ===== */

function boldBestValues() {
  var tables = document.querySelectorAll('.results-table, .benchmark-table');

  tables.forEach(function (table) {
    var rows = table.querySelectorAll('tbody tr');
    if (rows.length === 0) return;

    var numCols = rows[0].querySelectorAll('td:not(.category-label)').length;

    for (var col = 0; col < numCols; col++) {
      var best = -Infinity;
      var bestCell = null;

      rows.forEach(function (row) {
        var cells = row.querySelectorAll('td:not(.category-label)');
        if (col >= cells.length) return;
        var val = parseFloat(cells[col].textContent);
        if (!isNaN(val) && val > best) {
          best = val;
          bestCell = cells[col];
        }
      });

      if (bestCell && best > 0) {
        bestCell.classList.add('best-value');
      }
    }
  });
}

/* ===== Category Breakdown (pie chart) ===== */

function initCategoryPie() {
  fetch('./static/data/category_breakdown.csv')
    .then(function (res) { return res.text(); })
    .then(function (csv) {
      var canvas = document.getElementById('category-pie');
      if (!canvas) return;

      var lines = csv.trim().split('\n');
      var catOrder = [];
      var catTotals = {};

      for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split(',');
        var cat = cols[0].trim();
        var count = parseFloat(cols[2]);
        if (!catTotals[cat]) {
          catTotals[cat] = 0;
          catOrder.push(cat);
        }
        catTotals[cat] += count;
      }

      var labels = catOrder;
      var values = catOrder.map(function (c) { return catTotals[c]; });
      var colors = ['rgba(59, 130, 246, 0.5)', 'rgba(118, 185, 0, 0.5)', 'rgba(245, 158, 11, 0.5)'];

      new Chart(canvas, {
        type: 'pie',
        plugins: [ChartDataLabels],
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                  var pct = ((ctx.parsed / total) * 100).toFixed(1);
                  return ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
                }
              }
            },
            datalabels: {
              color: '#1a1a1a',
              font: {
                family: "'NVIDIA Sans', 'Noto Sans', sans-serif",
                weight: '400',
                size: 12
              },
              formatter: function (value, ctx) {
                return ctx.chart.data.labels[ctx.dataIndex] + '\n' + value;
              },
              textAlign: 'center'
            }
          }
        }
      });
    });
}

/* ===== Difficulty Distribution (pie chart) ===== */

function initDifficultyPie() {
  fetch('./static/data/difficulty_distribution.csv')
    .then(function (res) { return res.text(); })
    .then(function (csv) {
      var canvas = document.getElementById('difficulty-pie');
      if (!canvas) return;

      var lines = csv.trim().split('\n');
      var labels = [];
      var values = [];
      var avgLengths = [];

      for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split(',');
        labels.push(cols[0].trim());
        values.push(parseFloat(cols[1]));
        avgLengths.push(parseFloat(cols[2]));
      }

      var colors = ['#d1d5db', '#94a3b8', '#475569'];

      new Chart(canvas, {
        type: 'pie',
        plugins: [ChartDataLabels],
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                  var pct = ((ctx.parsed / total) * 100).toFixed(1);
                  var epLen = avgLengths[ctx.dataIndex];
                  return [
                    ctx.label + ': ' + ctx.parsed + ' tasks (' + pct + '%)',
                    'Avg episode length: ' + epLen + 's'
                  ];
                }
              }
            },
            datalabels: {
              color: function (ctx) {
                return ctx.dataIndex >= 2 ? '#fff' : '#1a1a1a';
              },
              font: {
                family: "'NVIDIA Sans', 'Noto Sans', sans-serif",
                weight: '400',
                size: 12
              },
              formatter: function (value, ctx) {
                return ctx.chart.data.labels[ctx.dataIndex] + '\n' + value;
              },
              textAlign: 'center'
            }
          }
        }
      });
    });
}

/* ===== Subtask Length Grouped Bar Chart ===== */

function initSubtaskGroupedBar() {
  fetch('./static/data/task_distribution.csv')
    .then(function (res) { return res.text(); })
    .then(function (csv) {
      var canvas = document.getElementById('subtask-grouped-bar');
      if (!canvas) return;

      var lines = csv.trim().split('\n');
      var categories = [];
      var datasets = {};

      for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split(',');
        var name = cols[0].trim();
        var category = cols[1].trim();
        var value = parseFloat(cols[2]);
        if (!datasets[category]) datasets[category] = {};
        datasets[category][name] = value;
        if (categories.indexOf(name) === -1) categories.push(name);
      }

      new Chart(canvas, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
          labels: categories,
          datasets: [
            {
              label: 'DROID',
              data: categories.map(function (c) { return datasets['droid'] ? datasets['droid'][c] || 0 : 0; }),
              backgroundColor: 'rgba(59, 130, 246, 0.4)',
              hoverBackgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: '#3b82f6',
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false
            },
            {
              label: 'Benchmark',
              data: categories.map(function (c) { return datasets['benchmark'] ? datasets['benchmark'][c] || 0 : 0; }),
              backgroundColor: 'rgba(118, 185, 0, 0.4)',
              hoverBackgroundColor: 'rgba(118, 185, 0, 0.6)',
              borderColor: '#76b900',
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 25 }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Percentage (%)',
                font: { family: "'NVIDIA Sans', 'Noto Sans', sans-serif", size: 12, weight: '600' },
                color: '#4a4a4a'
              },
              ticks: {
                font: { family: "'NVIDIA Sans', 'Noto Sans', sans-serif", size: 11 },
                color: '#888'
              },
              grid: { color: 'rgba(0,0,0,0.06)' }
            },
            x: {
              ticks: {
                font: { family: "'NVIDIA Sans', 'Noto Sans', sans-serif", size: 12, weight: '600' },
                color: '#1a1a1a'
              },
              grid: { display: false }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 16,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { family: "'NVIDIA Sans', 'Noto Sans', sans-serif", size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  return ctx.dataset.label + ': ' + ctx.parsed.y + '%';
                }
              }
            },
            datalabels: {
              anchor: 'end',
              align: 'end',
              color: '#1a1a1a',
              font: {
                family: "'NVIDIA Sans', 'Noto Sans', sans-serif",
                weight: '700',
                size: 11
              },
              formatter: function (value) {
                return value + '%';
              }
            }
          }
        }
      });
    });
}

/* ===== Venn Diagram Interactivity ===== */

function initVennDiagram() {
  var vennData = {
    droid: {
      title: 'DROID only (2,692 words)',
      items: 'table (19,524), counter (6,134), towel (6,132), lid (5,839), drawer (4,448), toy (4,221), cloth (4,029), cabinet (3,806), pen (3,252), tray (2,846), sink (2,756), door (2,555), button (2,513), paper (2,506), plush (2,309), bag (2,296), stove (2,091), shelf (2,079), glass (2,074), basket (2,021), countertop (1,894), jar (1,697), packet (1,499), holder (1,446), chair (1,395), faucet (1,318), kitchen (1,201), microwave (1,185), machine (1,090), ring (1,040) ... +2,662 more'
    },
    both: {
      title: 'Both (68 words) — 68.7% of benchmark',
      items: 'cup (13,503), bowl (11,675), marker (6,536), box (6,408), mug (5,832), bottle (4,867), pot (4,865), block (4,350), plate (3,815), container (3,316), spoon (2,869), rack (2,155), coffee (2,145), bin (1,334), cube (1,129), storage (1,056), cups (1,038), remote (805), fork (710), spatula (510), control (463), keyboard (425), crate (370), banana (317), ladle (223), lime (214), sauce (181), apple (174), chocolate (168), glasses (168) ... +38 more'
    },
    benchmark: {
      title: 'Benchmark only (31 words)',
      items: 'anza, bagel, bbq, birdhouse, blackandbrassbowl, cheez, crabbypenholder, cubebox, frozen, husky, lime01, lizard, mayonnaise, milkjug, oatmeal, plasticjerrican, plasticpail, pomegranate, pudding, pumpkinlarge, pumpkinsmall, raisin, ranch, redonion, screwtoppail, smartphone, squarepail, tuna, utilityjug, whitepackerbottle ... +1 more'
    }
  };

  var circles = document.querySelectorAll('.venn-circle');
  var tooltip = document.getElementById('venn-tooltip');
  if (!tooltip || circles.length < 2) return;

  var droidCircle = circles[0];
  var benchCircle = circles[1];

  function showTooltip(e, key) {
    var d = vennData[key];
    tooltip.innerHTML = '<div class="venn-tip-title">' + d.title + '</div><div class="venn-tip-list">' + d.items + '</div>';
    tooltip.style.display = 'block';
    positionTooltip(e);
  }

  function positionTooltip(e) {
    var container = document.querySelector('.venn-container');
    var rect = container.getBoundingClientRect();
    var x = e.clientX - rect.left + 15;
    var y = e.clientY - rect.top - 10;
    if (x + 280 > rect.width) x = x - 300;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
  }

  droidCircle.addEventListener('mouseenter', function (e) {
    droidCircle._lastZone = null;
    showTooltip(e, 'droid');
  });

  droidCircle.addEventListener('mousemove', function (e) {
    var svgRect = droidCircle.closest('svg').getBoundingClientRect();
    var overlapX = svgRect.left + (41 / 85) * svgRect.width;
    var zone = e.clientX > overlapX ? 'both' : 'droid';
    if (zone !== droidCircle._lastZone) {
      droidCircle._lastZone = zone;
      showTooltip(e, zone);
    }
    positionTooltip(e);
  });

  droidCircle.addEventListener('mouseleave', hideTooltip);

  benchCircle.addEventListener('mouseenter', function (e) {
    benchCircle._lastZone = null;
    showTooltip(e, 'benchmark');
  });

  benchCircle.addEventListener('mousemove', function (e) {
    var svgRect = benchCircle.closest('svg').getBoundingClientRect();
    var overlapX = svgRect.left + (52 / 85) * svgRect.width;
    var zone = e.clientX < overlapX ? 'both' : 'benchmark';
    if (zone !== benchCircle._lastZone) {
      benchCircle._lastZone = zone;
      showTooltip(e, zone);
    }
    positionTooltip(e);
  });

  benchCircle.addEventListener('mouseleave', hideTooltip);
}

/* ===== Sticky nav: show after scrolling past hero, highlight active section ===== */

function initStickyNav() {
  var nav = document.getElementById('sticky-nav');
  var hero = document.getElementById('hero');
  if (!nav || !hero) return;

  var navLinks = nav.querySelectorAll('.nav-link[data-section]');
  var sections = [];
  navLinks.forEach(function (link) {
    var sec = document.getElementById(link.getAttribute('data-section'));
    if (sec) sections.push({ id: link.getAttribute('data-section'), el: sec });
  });

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        var heroBottom = hero.offsetTop + hero.offsetHeight - 80;

        if (scrollY > heroBottom) {
          nav.classList.add('visible');
        } else {
          nav.classList.remove('visible');
        }

        var current = '';
        for (var i = sections.length - 1; i >= 0; i--) {
          if (scrollY >= sections[i].el.offsetTop - 100) {
            current = sections[i].id;
            break;
          }
        }

        navLinks.forEach(function (link) {
          if (link.getAttribute('data-section') === current) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        ticking = false;
      });
      ticking = true;
    }
  });
}

