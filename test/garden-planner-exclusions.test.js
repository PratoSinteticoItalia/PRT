import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../garden-planner-page.js', import.meta.url), 'utf8');
const start = source.indexOf('function plannerNetArea(');
const end = source.indexOf('function createPlannerArea(', start);
const net = vm.runInNewContext(source.slice(start, end) + '\nplannerNetArea;');
const rect = (x, y, w, h) => [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
test('planner: inner obstacle and outside obstacle', () => {
  near(net([rect(0,0,10,10)], [rect(2,2,3,4)]),88);
  near(net([rect(0,0,10,10)], [rect(20,20,3,4)]),100);
  near(net([rect(0,0,10,10)], [rect(8,8,4,4)]),96);
});
test('planner: overlapping holes subtracted once, including duplicates', () => {
  near(net([rect(0,0,10,10)], [rect(1,1,4,4),rect(3,3,4,4)]),72);
  near(net([rect(0,0,10,10)], [rect(1,1,4,4),rect(1,1,4,4)]),84);
});
test('planner: overlapping turf counted once, full exclusion, disjoint turf', () => {
  near(net([rect(0,0,4,4),rect(2,2,4,4)]),28);
  near(net([rect(0,0,4,4)], [rect(-1,-1,6,6)]),0);
  near(net([rect(0,0,4,4),rect(8,0,4,4)], [rect(3,-1,6,6)]),24);
});
test('planner: diagonal intersections, reversed winding and concave polygons', () => {
  const triangle = [{x:0,y:0},{x:10,y:0},{x:0,y:10}];
  near(net([triangle], [rect(0,0,5,5)]),25);
  near(net([triangle.slice().reverse()], [rect(0,0,5,5)]),25);
  const l = [{x:0,y:0},{x:6,y:0},{x:6,y:2},{x:2,y:2},{x:2,y:6},{x:0,y:6}];
  near(net([l], [rect(1,1,3,3)]),15);
  // Two crossing triangles create an intersection event away from all vertices.
  near(net([triangle], [[{x:0,y:0},{x:10,y:10},{x:10,y:0}]]),25);
});
test('planner: empty and degenerate input', () => {
  near(net([], [rect(0,0,1,1)]),0);
  near(net([[{x:0,y:0},{x:1,y:1},{x:2,y:2}]]),0);
});
const cornersStart = source.indexOf('function getRollCorners(');
const cornersEnd = source.indexOf('function isRollInsidePolygon(', cornersStart);
const usage = vm.runInNewContext('const MANUAL_ROLL_WIDTH_M = 2;\n' + source.slice(cornersStart, cornersEnd) + source.slice(start, end) + '\nplannerRollUsage;');
const lawn = { kind:'turf', closed:true, points:rect(0,0,10,10) };
test('planner: roll outside lawn never counts as coverage', () => {
  const result = usage([lawn], [{cx:20,cy:20,length:10,width:2,angle:0}]);
  near(result.covered,0); near(result.uncovered,100); near(result.offcut,20); near(result.wastePercent,100);
});
test('planner: duplicate rolls are excess material, not double coverage', () => {
  const roll = {cx:5,cy:1,length:10,width:2,angle:0};
  const result = usage([lawn],[roll,roll]);
  near(result.covered,20); near(result.material,40); near(result.overlap,20); near(result.offcut,0); near(result.unused,20);
});
test('planner: obstacles remove roll coverage and create potential cutoffs', () => {
  const obstacle = {kind:'exclusion',closed:true,points:rect(2,0,2,2)};
  const result = usage([lawn, obstacle],[{cx:5,cy:1,length:10,width:2,angle:0}]);
  near(result.netArea,96); near(result.covered,16); near(result.offcut,4); near(result.uncovered,80); near(result.wastePercent,20);
});
test('planner: rotated rolls and empty layout', () => {
  const result = usage([lawn],[{cx:1,cy:5,length:10,width:2,angle:Math.PI/2}]);
  near(result.covered,20); near(result.offcut,0);
  const empty = usage([lawn],[]); near(empty.uncovered,100); near(empty.wastePercent,0);
});
const needsStart = source.indexOf('function estimateInstallationNeeds(');
const needsEnd = source.indexOf('// Percentuale di scarto', needsStart);
const estimateNeeds = vm.runInNewContext(source.slice(needsStart, needsEnd) + '\nestimateInstallationNeeds;', {
  INSTALLATION_RULES: {geoCoverageFactor:1.05,layoutCoverageMin:0.9,glueKgPerSqm:0.3,jointMetersPerSqm:0.55,pinsPerLinearMeter:2.2},
  TAPE_ROLL_M:25, GLUE_BUCKET_KG:6,
  estimateRollLayoutMetrics: () => ({coverageArea:100,rollCount:1,jointMeters:0}),
});
test('planner: a large roll outside lawn cannot enable layout-based glue calculation', () => {
  const result = estimateNeeds(70,34,[],{material:100,covered:0,unused:100});
  assert.equal(result.calcMode,'area'); near(result.glueKg,21); near(result.layoutCoverageRatio,0); near(result.rollWasteArea,100);
});
