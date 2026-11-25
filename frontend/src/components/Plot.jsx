import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist-min';
const Plot=createPlotlyComponent(Plotly);
export default function Chart({data,layout={},height=220,theme='dark'}){
 const dark=theme==='dark';
 const grid=dark?'#253348':'#e0e8ef';
 const axis={gridcolor:grid,zerolinecolor:grid,tickfont:{size:11}};
 return <Plot data={data} layout={{autosize:true,height,margin:{t:12,r:12,b:42,l:39},paper_bgcolor:'transparent',plot_bgcolor:'transparent',font:{family:'Inter, sans-serif',color:dark?'#9aabc0':'#506477'},xaxis:axis,yaxis:axis,showlegend:false,...layout}} config={{displayModeBar:false,responsive:true,displaylogo:false}} useResizeHandler style={{width:'100%'}}/>;
}
