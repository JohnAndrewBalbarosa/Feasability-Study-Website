<prompt level="15" name="Closed-Loop Break-Even Driven Procurement-to-Sales Intelligence System">

    <requirements>

        <business_context>
            Organization requires deterministic decisions with traceable logic and no arbitrary pricing/procurement.
        </business_context>

        <system_goals>
            <goal>Use break-even analysis as the first mandatory decision gate</goal>
            <goal>Run AI forecasting only after break-even and cost model are available</goal>
            <goal>Derive procurement strictly from forecast outputs</goal>
            <goal>Derive production strictly from procurement outputs</goal>
            <goal>Close the loop by comparing actual outcomes vs predicted outcomes</goal>
            <goal>Persist finalized records only with audit logs and timestamps</goal>
            <goal>Allow access only for approved Google organization accounts</goal>
            <goal>Use non-technical, business-readable UI language for operations teams</goal>
        </system_goals>

        <functional_requirements>
            <requirement>Asynchronous frontend break-even computation with session cache</requirement>
            <requirement>Structured AI inputs/outputs only (no free-text contracts)</requirement>
            <requirement>Forecast low/expected/high scenario outputs</requirement>
            <requirement>Procurement plan based on forecasted expected demand</requirement>
            <requirement>Production plan based on procured raw materials</requirement>
            <requirement>Feedback loop metrics for actual vs predicted variance</requirement>
            <requirement>Finalized payload logging to Supabase with versioning</requirement>
            <requirement>Google login with approved-email authorization check</requirement>
            <requirement>Unauthorized account handling with 5-second redirect to login</requirement>
            <requirement>Table-based single-row operational input layout</requirement>
        </functional_requirements>

        <non_functional_requirements>
            <requirement>Auditability (event logs + immutable timestamps)</requirement>
            <requirement>Modularity (break-even, forecast, procurement, production as separable modules)</requirement>
            <requirement>Scalability (future product and bundle variants)</requirement>
            <requirement>Near real-time UI responsiveness through async non-blocking operations</requirement>
            <requirement>Local-first deployment and validation before cloud release</requirement>
        </non_functional_requirements>

    </requirements>


    <inputs>

        <financial_inputs>
            <input name="budget_available" type="float"/>
            <input name="fixed_cost" type="float"/>
            <input name="estimated_variable_cost_per_unit" type="float"/>
            <input name="selling_price_per_unit" type="float"/>
        </financial_inputs>

        <market_inputs>
            <input name="market_prices" type="list"/>
            <input name="market_trends" type="list"/>
            <input name="demand_signals" type="list"/>
            <input name="pricing_volatility" type="enum(low|medium|high)"/>
        </market_inputs>

        <operational_inputs>
            <input name="product_name" type="string"/>
            <input name="conversion_rate_raw_to_product" type="float"/>
            <input name="bundle_size" type="integer"/>
        </operational_inputs>

    </inputs>


    <phases>

        <phase_group type="sequential" name="Decision Entry Pipeline">

            <phase id="P1" name="Break-Even Entry Gate">
                <process>
                    Frontend computes break-even asynchronously from cost model.
                    Result is cached per session using cost/pricing cache key.
                    Pipeline cannot continue until break-even result exists.
                </process>
                <output>break_even_result</output>
            </phase>

            <phase id="P2" name="Cost Model Freeze">
                <process>
                    Lock fixed cost, variable cost, and selling price snapshot.
                    Mark snapshot as deterministic input for downstream phases.
                </process>
                <output>cost_model_snapshot</output>
            </phase>

        </phase_group>


        <phase_group type="parallel" name="Intelligence Layer">

            <phase id="P3" name="AI Forecasting (Depends on Break-Even)">
                <inputs>
                    <input>break_even_result</input>
                    <input>cost_model_snapshot</input>
                    <input>market_signals</input>
                </inputs>
                <process>
                    Generate low/expected/high demand forecast.
                    Output production recommendation and pricing insights.
                    Emit strict structured JSON only.
                </process>
                <output>forecast_result</output>
            </phase>

            <phase id="P4" name="Analytics Signal Scoring">
                <inputs>
                    <input>market_signals</input>
                    <input>break_even_result</input>
                </inputs>
                <process>
                    Score volatility impact and confidence level.
                    Publish explainability metadata for forecast interpretation.
                </process>
                <output>analytics_signal_score</output>
            </phase>

        </phase_group>


        <phase_group type="sequential" name="Execution Planning Pipeline">

            <phase id="P5" name="Forecast-Driven Procurement">
                <inputs>
                    <input>forecast_result</input>
                    <input>budget_available</input>
                    <input>market_prices</input>
                </inputs>
                <process>
                    Convert expected demand to raw material requirement.
                    Purchase from lowest-cost sources while respecting budget.
                </process>
                <output>procurement_plan</output>
            </phase>

            <phase id="P6" name="Procurement-Driven Production">
                <inputs>
                    <input>procurement_plan</input>
                    <input>conversion_rate_raw_to_product</input>
                </inputs>
                <process>
                    Convert procured raw quantity to producible units.
                    Compute demand gap against forecast expected demand.
                </process>
                <output>production_plan</output>
            </phase>

            <phase id="P7" name="Packaging + Financial Projection">
                <inputs>
                    <input>production_plan</input>
                    <input>bundle_size</input>
                    <input>cost_model_snapshot</input>
                </inputs>
                <process>
                    Compute package distribution and expected profit/loss.
                    Build profit curve for dashboard and diagnostics.
                </process>
                <output>financial_projection</output>
            </phase>

        </phase_group>


        <phase_group type="sequential" name="Persistence and Feedback Loop">

            <phase id="P8" name="Finalize and Persist">
                <process>
                    Persist finalized payload only:
                    break_even_result + forecast_result + procurement_plan + production_plan.
                    Save pipeline version and timestamp.
                    Write audit event log.
                </process>
                <output>finalized_run_record</output>
            </phase>

            <phase id="P9" name="Feedback Loop (Actual vs Predicted)">
                <process>
                    Compare actual demand/sales vs forecast low/expected/high.
                    Quantify variance for next-cycle model and prompt improvements.
                </process>
                <output>feedback_metrics</output>
            </phase>

        </phase_group>

    </phases>


    <data_flow>
        <flow>Cost Inputs -> Break-Even Entry Gate -> Cost Model Freeze</flow>
        <flow>Break-Even Result + Cost Model + Market Signals -> AI Forecast</flow>
        <flow>AI Forecast -> Forecast-Driven Procurement</flow>
        <flow>Procurement Plan -> Procurement-Driven Production</flow>
        <flow>Production Plan -> Packaging + Financial Projection</flow>
        <flow>Finalized Outputs -> Supabase + Audit Logs</flow>
        <flow>Actual Outcomes -> Feedback Loop -> Next Forecast Cycle</flow>
    </data_flow>


    <outputs>

        <primary>
            <output>break_even_result</output>
            <output>forecast_result</output>
            <output>procurement_plan</output>
            <output>production_plan</output>
            <output>expected_profit_or_loss</output>
        </primary>

        <secondary>
            <output>packaging_distribution</output>
            <output>profit_curve_graph</output>
            <output>audit_log_entries</output>
            <output>feedback_metrics</output>
        </secondary>

    </outputs>


    <constraints>
        <constraint>Break-even must be computed before AI forecasting</constraint>
        <constraint>AI forecasting must emit structured output only</constraint>
        <constraint>Procurement must depend on forecast output</constraint>
        <constraint>Production must depend on procurement output</constraint>
        <constraint>Only finalized records are persisted to backend</constraint>
        <constraint>All finalized writes must produce audit log events</constraint>
        <constraint>Only accounts listed in ALLOWED_GOOGLE_EMAILS may access the system</constraint>
        <constraint>Unauthorized accounts must be signed out and redirected to login after 5 seconds</constraint>
        <constraint>UI copy should avoid internal developer terminology on operational pages</constraint>
    </constraints>

</prompt>
