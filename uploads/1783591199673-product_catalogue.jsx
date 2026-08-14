import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getShipments,
  createShipment,
  updateShipment,
  deleteShipment,
} from "../../feature/shipments/shipmentThunks";

import {
  selectShipments,
  selectShipmentLoading,
} from "../../feature/shipments/shipmentSelector";

import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";

import Loader from "../../components/commonComponents/Loader";
import CommonButton from "../../components/commonComponents/CommonButton";
import CommonLabel from "../../components/commonComponents/CommonLabel";
import CommonToast from "../../components/commonComponents/Toster";
import CommonSearchField from "../../components/commonComponents/CommonSearchField";

const Shipment = () => {
  const dispatch = useDispatch();

  const shipments = useSelector(selectShipments);
  const loading = useSelector(selectShipmentLoading);

  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [isViewing, setIsViewing] = useState(false);
  const [viewShipment, setViewShipment] = useState(null);

  const [form, setForm] = useState({
    supplier_name: "",
    supplier_invoice_no: "",
    invoice_currency: "",
    invoice_value_foreign: "",
    exchange_rate: "",
    invoice_value_inr: "",
    bl_awb_no: "",
    arrival_date: "",
  });

  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState({
    supplier_name: "",
    supplier_invoice_no: "",
    invoice_currency: "",
    arrival_date: "",
  });

  // ✅ FIX: Track previous search to prevent infinite loop
  const prevSearchRef = useRef();

  // Fetch shipments initially and whenever search changes
  useEffect(() => {
    // Only fetch if search actually changed
    const searchChanged =
      JSON.stringify(prevSearchRef.current) !== JSON.stringify(search);

    if (searchChanged || !prevSearchRef.current) {
      dispatch(getShipments(search));
      setPage(1);
      prevSearchRef.current = search;
    }
  }, [search, dispatch]);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Simple validation
  const validate = () => {
    const temp = {};
    if (!form.supplier_name) temp.supplier_name = "Supplier name is required";
    if (!form.supplier_invoice_no)
      temp.supplier_invoice_no = "Invoice number is required";
    if (!form.invoice_currency) temp.invoice_currency = "Currency is required";
    if (!form.invoice_value_foreign)
      temp.invoice_value_foreign = "Invoice value is required";
    if (!form.exchange_rate) temp.exchange_rate = "Exchange rate is required";
    if (!form.arrival_date) temp.arrival_date = "Arrival date is required";

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const action = editId
      ? updateShipment({ id: editId, data: form })
      : createShipment(form);

    dispatch(action)
      .unwrap()
      .then(() => {
        dispatch(getShipments(search));
        handleReset();
        CommonToast(
          editId
            ? "Shipment updated successfully"
            : "Shipment created successfully",
          "success"
        );
      })
      .catch((err) =>
        CommonToast(err.message || "Failed to save shipment", "error")
      );
  };

  const handleView = (shipment) => {
    setViewShipment(shipment);
    setIsViewing(true);
  };

  const handleEdit = (shipment) => {
    setIsEditing(true);
    setEditId(shipment.id);
    setForm({
      supplier_name: shipment.supplier_name,
      supplier_invoice_no: shipment.supplier_invoice_no,
      invoice_currency: shipment.invoice_currency,
      invoice_value_foreign: shipment.invoice_value_foreign,
      exchange_rate: shipment.exchange_rate,
      invoice_value_inr: shipment.invoice_value_inr,
      bl_awb_no: shipment.bl_awb_no,
      arrival_date: shipment.arrival_date?.split("T")[0],
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this shipment?")) {
      dispatch(deleteShipment(id))
        .unwrap()
        .then(() => {
          dispatch(getShipments(search));
          CommonToast("Shipment deleted successfully", "success");
        })
        .catch((err) =>
          CommonToast(err.message || "Failed to delete shipment", "error")
        );
    }
  };

  const handleReset = () => {
    setForm({
      supplier_name: "",
      supplier_invoice_no: "",
      invoice_currency: "",
      invoice_value_foreign: "",
      exchange_rate: "",
      invoice_value_inr: "",
      bl_awb_no: "",
      arrival_date: "",
    });
    setErrors({});
    setEditId(null);
    setIsEditing(false);
  };

  const handleAdd = () => {
    handleReset();
    setIsEditing(true);
  };

  // Paginate shipments
  const paginatedData = useMemo(() => {
    return shipments?.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [shipments, page]);

  if (isEditing) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <Box width="100%">
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <IconButton onClick={handleReset}>
              <ArrowBackIcon />
            </IconButton>
            <CommonLabel>
              {editId ? "Edit Shipment" : "Create Shipment"}
            </CommonLabel>
          </Stack>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                label="Supplier Name"
                name="supplier_name"
                value={form.supplier_name}
                onChange={handleChange}
                error={!!errors.supplier_name}
                helperText={errors.supplier_name}
                fullWidth
              />

              <TextField
                label="Supplier Invoice No"
                name="supplier_invoice_no"
                value={form.supplier_invoice_no}
                onChange={handleChange}
                error={!!errors.supplier_invoice_no}
                helperText={errors.supplier_invoice_no}
                fullWidth
              />

              <TextField
                label="Invoice Currency"
                name="invoice_currency"
                value={form.invoice_currency}
                onChange={handleChange}
                error={!!errors.invoice_currency}
                helperText={errors.invoice_currency}
                fullWidth
              />

              <TextField
                label="Invoice Value (Foreign)"
                name="invoice_value_foreign"
                value={form.invoice_value_foreign}
                onChange={handleChange}
                error={!!errors.invoice_value_foreign}
                helperText={errors.invoice_value_foreign}
                fullWidth
              />

              <TextField
                label="Exchange Rate"
                name="exchange_rate"
                value={form.exchange_rate}
                onChange={handleChange}
                error={!!errors.exchange_rate}
                helperText={errors.exchange_rate}
                fullWidth
              />

              <TextField
                label="Invoice Value (INR)"
                name="invoice_value_inr"
                value={form.invoice_value_inr}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="BL / AWB No"
                name="bl_awb_no"
                value={form.bl_awb_no}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                type="date"
                label="Arrival Date"
                name="arrival_date"
                value={form.arrival_date}
                onChange={handleChange}
                error={!!errors.arrival_date}
                helperText={errors.arrival_date}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <CommonButton variant="outlined" onClick={handleReset}>
                  Cancel
                </CommonButton>
                <CommonButton
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </CommonButton>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (isViewing && viewShipment) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <Box width="100%">
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <IconButton
              onClick={() => {
                setIsViewing(false);
                setViewShipment(null);
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <CommonLabel>View Shipment</CommonLabel>
          </Stack>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              {[
                ["Supplier Name", viewShipment.supplier_name],
                ["Invoice No", viewShipment.supplier_invoice_no],
                ["Currency", viewShipment.invoice_currency],
                ["Invoice Value (Foreign)", viewShipment.invoice_value_foreign],
                ["Exchange Rate", viewShipment.exchange_rate],
                ["Invoice Value (INR)", viewShipment.invoice_value_inr],
                ["BL / AWB No", viewShipment.bl_awb_no],
                ["Arrival Date", viewShipment.arrival_date?.split("T")[0]],
              ].map(([label, value]) => (
                <TextField
                  key={label}
                  label={label}
                  value={value || "-"}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (loading) return <Loader text="Loading shipments..." fullScreen />;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={700} sx={{ color: "#7E7E7E" }}>
          Shipments
        </Typography>

        <CommonButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Shipment
        </CommonButton>
      </Stack>

      {/* ===== Search Fields ===== */}
      <Stack direction="row" spacing={1} mb={2}>
        <CommonSearchField
          value={search.supplier_name}
          placeholder="Search by supplier name..."
          onChange={(value) =>
            setSearch((prev) => ({ ...prev, supplier_name: value }))
          }
        />
        <CommonSearchField
          value={search.supplier_invoice_no}
          placeholder="Search by invoice no..."
          onChange={(value) =>
            setSearch((prev) => ({ ...prev, supplier_invoice_no: value }))
          }
        />
        <CommonSearchField
          value={search.invoice_currency}
          placeholder="Search by currency..."
          onChange={(value) =>
            setSearch((prev) => ({ ...prev, invoice_currency: value }))
          }
        />
        <CommonSearchField
          type="date"
          value={search.arrival_date}
          placeholder="Arrival Date"
          onChange={(value) =>
            setSearch((prev) => ({ ...prev, arrival_date: value }))
          }
        />
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {[
                "Sr",
                "Supplier",
                "Invoice No",
                "Currency",
                "Invoice INR",
                "Arrival Date",
                "Actions",
              ].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData && paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{item.supplier_name}</TableCell>
                  <TableCell>{item.supplier_invoice_no}</TableCell>
                  <TableCell>{item.invoice_currency}</TableCell>
                  <TableCell>{item.invoice_value_inr}</TableCell>
                  <TableCell>{item.arrival_date?.split("T")[0]}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleView(item)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEdit(item)}
                      color="warning"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No shipments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack alignItems="flex-end" mt={3}>
        <Pagination
          count={Math.ceil((shipments?.length || 0) / rowsPerPage)}
          page={page}
          onChange={(_, v) => setPage(v)}
          color="primary"
        />
      </Stack>
    </Box>
  );
};

export default Shipment;
