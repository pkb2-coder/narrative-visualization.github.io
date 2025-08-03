let scene = 0;
const NUM_SCENES = 3;
let data;  // csv data
let states; // unique state names

const annotationTexts = [
    "Scene 1: National COVID-19 case trends",
    "Scene 2: Total COVID cases by state",
    "Scene 3: Select a state to see its history, explore COVID cases and deaths for the selected state"
];

d3.select("#prev").on("click", () => gotoScene(scene - 1));
d3.select("#next").on("click", () => gotoScene(scene + 1));

// Load data
d3.csv("us-states.csv", d3.autoType).then(loaded => {
    data = loaded;
    states = Array.from(new Set(data.map(d => d.state))).sort();
    gotoScene(0);
});

function gotoScene(s) {
    scene = Math.max(0, Math.min(NUM_SCENES - 1, s));
    d3.select("#scene-indicator").text(`Scene ${scene + 1} / ${NUM_SCENES}`);
    d3.select("#prev").attr("disabled", scene === 0 ? true : null);
    d3.select("#next").attr("disabled", scene === NUM_SCENES - 1 ? true : null);
    d3.select("#annotation").text(annotationTexts[scene]);
    renderScene(scene);
}

function renderScene(scene) {
    d3.select("#viz-container").selectAll("*").remove();
    d3.select("#state-selector").selectAll("*").remove();

    if (scene === 0) {
        renderUSLineChart();
    } else if (scene === 1) {
        renderStateBarChart();
    } else if (scene === 2) {
        renderStateSelector();
        renderStateLineChart(states[0]);
    }
}

// Scene 1: Summary line chart of covid cases
function renderUSLineChart() {
    const usData = Array.from(
        d3.rollup(
            data,
            v => d3.sum(v, d => d.cases),
            d => d.date
        ),
        ([date, cases]) => ({ date, cases })
    ).sort((a, b) => d3.ascending(a.date, b.date));

    const width = 800, height = 400, margin = { left: 60, right: 40, top: 30, bottom: 40 };
    const svg = d3.select("#viz-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleTime()
        .domain(d3.extent(usData, d => d.date))
        .range([margin.left, width - margin.right]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(usData, d => d.cases)]).nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width/100));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.append("path")
        .datum(usData)
        .attr("fill", "none")
        .attr("stroke", "#3e88c2")
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y(d.cases)));

    svg.append("text")
        .attr("x", width/2)
        .attr("y", margin.top-10)
        .attr("text-anchor", "middle")
        .attr("font-size", 20)
        .attr("font-weight", 600)
        .text("Total COVID-19 Cases in US Over Time");
}

// Scene 2: Bar Chart
function renderStateBarChart() {
    const latestDate = d3.max(data, d => d.date);
    const stateCases = Array.from(
        d3.rollup(
            data.filter(d => d.date.getTime() === latestDate.getTime()),
            v => d3.sum(v, d => d.cases),
            d => d.state
        ),
        ([state, cases]) => ({ state, cases })
    ).sort((a, b) => d3.descending(a.cases, b.cases));

    const width = 800, height = 520, margin = { left: 120, right: 40, top: 30, bottom: 40 };
    const svg = d3.select("#viz-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const y = d3.scaleBand()
        .domain(stateCases.map(d => d.state))
        .range([margin.top, height - margin.bottom])
        .padding(0.15);

    const x = d3.scaleLinear()
        .domain([0, d3.max(stateCases, d => d.cases)]).nice()
        .range([margin.left, width - margin.right]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width/100));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(stateCases)
        .join("rect")
        .attr("class", "bar")
        .attr("x", x(0))
        .attr("y", d => y(d.state))
        .attr("width", d => x(d.cases) - x(0))
        .attr("height", y.bandwidth())
        .attr("fill", "#ec6464");

    svg.append("text")
        .attr("x", width/2)
        .attr("y", margin.top-10)
        .attr("text-anchor", "middle")
        .attr("font-size", 20)
        .attr("font-weight", 600)
        .text(`Total Cases by State (as of ${latestDate.toLocaleDateString()})`);
}

// Scene 3: State Selector
function renderStateSelector() {
    const sel = d3.select("#state-selector").append("select")
        .on("change", function() {
            renderStateLineChart(this.value);
        });
    sel.selectAll("option")
        .data(states)
        .join("option")
        .attr("value", d => d)
        .text(d => d);
}

function renderStateLineChart(selectedState) {
    d3.select("#viz-container").selectAll("*").remove();

    const stateData = data.filter(d => d.state === selectedState)
        .sort((a, b) => d3.ascending(a.date, b.date));

    const width = 800, height = 400, margin = { left: 60, right: 40, top: 30, bottom: 40 };
    const svg = d3.select("#viz-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleTime()
        .domain(d3.extent(stateData, d => d.date))
        .range([margin.left, width - margin.right]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(stateData, d => d.cases)]).nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width/100));
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.append("path")
        .datum(stateData)
        .attr("fill", "none")
        .attr("stroke", "#eeb13f")
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y(d.cases)));

    svg.append("text")
        .attr("x", width/2)
        .attr("y", margin.top-10)
        .attr("text-anchor", "middle")
        .attr("font-size", 20)
        .attr("font-weight", 600)
        .text(`COVID-19 Cases in ${selectedState} Over Time`);

    // Add tooltips on hover
    svg.selectAll("circle")
        .data(stateData.filter((d,i) => i%14 === 0 || i===stateData.length-1))
        .join("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.cases))
        .attr("r", 4)
        .attr("fill", "#1748a3")
        .on("mouseover", function(e, d) {
            d3.select("#annotation").text(
                `On ${d.date.toLocaleDateString()}, ${selectedState} had ${d.cases.toLocaleString()} cases and ${d.deaths.toLocaleString()} deaths.`
            );
            d3.select(this).attr("fill", "#b92727");
        })
        .on("mouseout", function() {
            d3.select("#annotation").text(annotationTexts[2]);
            d3.select(this).attr("fill", "#1748a3");
        });
}