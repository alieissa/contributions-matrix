// TODO: Add days and months axes
// TODO: Fix table styles
// TODO: Add contributions legend

// Size of cell representing day (12) and padding around around it (2)
const cellSize = 12
const paddedCellSize = cellSize + 2
// Query to get the last 53 weeks of contributions
const contributionQuery = `{
  user(login: "alieissa") {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            color
            contributionCount
            date
            weekday
          }
        }
      }
    }
  }
}`

const getContributions = () =>
  fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`, // API token defined in config.js
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: contributionQuery }),
  })
    .then((response) => response.json())
    .then(
      (body) =>
        body.data.user.contributionsCollection.contributionCalendar.weeks
    )

// Return information to be shown in tooltip
function getTooltipMessageStartContent(datum) {
  if (datum.contributionCount === 0) {
    return `No contributions on`
  } else if (datum.contributionCount === 1) {
    return `1 contribution on`
  } else {
    return `${datum.contributionCount} contributions on `
  }
}

/**
 * Gets the left position of the tooltip so that tooltip is horizontally centered to
 * anchor rectangle. To center we move the left of the edge of the tooltip to the
 * center of the cell (x + cellSize /2) and then subtract half of the width of the
 * the tooltip (tooltipWidth / 2) which finally brings the center of the tooltip to
 * the center of the cell
 */
const getTooltipLeftPosition = (d3Node) => {
  const tooltipWidth = 190
  const { x } = d3.select(d3Node).node().getBoundingClientRect()
  return x + cellSize / 2 - tooltipWidth / 2 + 'px'
}

/**
 * Gets the top position of the tooltip so that the tootip is directly above the
 * anchor cell.
 */
const getTooltipTopPosition = (d3Node) => {
  const tooltipHeight = 24
  const tooltipArrowHeight = 5
  const { y } = d3.select(d3Node).node().getBoundingClientRect()
  return y - tooltipHeight - tooltipArrowHeight - cellSize + 'px'
}

getContributions()
  .then((data) => {
    /**
     * Tooltip contains two elements, the tooltip message container and date container.
     * The message container contains the beginning of the tooltip message, e.g.
     *  "3 contributions on ", while the date-container contais the date, e.g.
     *  Aug 3, 2019. Both together give the message "3 contribution on Aug 3, 2019".
     */
    const tooltip = d3.select('.tooltip')
    const tooltipDate = tooltip.select('.tooltip__date-container')
    const tooltipMessageStart = tooltip.select('.tooltip__message-container')

    // Each week is drawn as a column
    const weeks = d3
      .select('svg')
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (_, i) => `translate(${paddedCellSize * i}, 0)`)

    // Draw each day in week for all weeks
    weeks.each((week, i, weekNodes) => {
      d3.select(weekNodes[i])
        .selectAll('rect')
        .data(week.contributionDays)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => paddedCellSize * d.weekday)
        .attr('fill', (d) => d.color)
        .on('mouseover', (d, j, dayNodes) => {
          /**
           * Cannot chain all methods together like
           *    tooltip
           *      .transitions
           *      .duration(200)
           *      .style('opacity', 0.8)
           *      .style('left', :left)
           * Error transition not a function error thrown
           */
          tooltip.transition().duration(200).style('opacity', 1)
          tooltip
            .style('left', getTooltipLeftPosition(dayNodes[j]))
            .style('top', getTooltipTopPosition(dayNodes[j]))

          tooltipMessageStart.html(`${getTooltipMessageStartContent(d)}`)
          tooltipDate.html(moment(d.date).format('ll'))
        })
        .on('mouseout', (d) => {
          tooltip.transition().duration(200).style('opacity', 0)
        })
    })
  })
  .catch((err) => console.log('Unable to get contributions', err))
